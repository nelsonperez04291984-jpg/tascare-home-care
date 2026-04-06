import pool from '../db.js';
import { calculateDistance, getTravelTime } from '../services/geoService.js';

export const getSupportWorkers = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const { target_date, target_time, duration_hours, target_suburb, service_type } = req.query;

    if (target_date && target_time && duration_hours) {
      const targetDatetime = `${target_date} ${target_time}:00`;
      
      const query = `
        SELECT w.id, w.name, w.qualifications, w.service_areas, w.home_suburb, w.max_travel_km,
               w.has_car, w.employment_type,
               wa.start_time as baseline_start, wa.end_time as baseline_end,
               
               CASE WHEN wa.id IS NULL THEN false
                    WHEN $3::time >= wa.start_time AND ($3::time + ($4 || ' hours')::interval) <= wa.end_time THEN true
                    ELSE false END AS is_baseline_available,
                    
               (SELECT COUNT(s.id) FROM schedules s 
                WHERE s.worker_id = w.id 
                  AND s.status != 'cancelled'
                  AND s.scheduled_at < ($2::timestamp + ($4 || ' hours')::interval)
                  AND (s.scheduled_at + (s.duration_hours || ' hours')::interval) > $2::timestamp
               ) as schedule_conflicts,
               
               (SELECT COUNT(t.id) FROM worker_time_off t
                WHERE t.worker_id = w.id
                  AND t.start_datetime < ($2::timestamp + ($4 || ' hours')::interval)
                  AND t.end_datetime > $2::timestamp
               ) as leave_conflicts,

               -- Phase 9: Compliance Check (Missing/Expired Mandatory Govt Quals)
               (SELECT COUNT(qt.id) 
                FROM qualification_types qt
                WHERE qt.is_government_locked = true AND qt.is_mandatory = true
                  AND NOT EXISTS (
                    SELECT 1 FROM worker_qualifications wq 
                    WHERE wq.worker_id = w.id AND wq.type_id = qt.id 
                      AND (wq.expiry_date IS NULL OR wq.expiry_date > CURRENT_DATE)
                      AND wq.verified = true
                  )
               ) as missing_mandatory_quals,

               -- Phase 9: Service Authorization Check
               (SELECT COUNT(ws.id) FROM worker_services ws 
                WHERE ws.worker_id = w.id AND ws.service_type = $5
               ) as is_authorized_for_service
               
        FROM support_workers w
        LEFT JOIN worker_availability wa 
               ON wa.worker_id = w.id 
              AND wa.day_of_week = EXTRACT(DOW FROM $2::timestamp)
        WHERE w.tenant_id = $1 AND w.is_active = true
      `;
      
      const result = await pool.query(query, [tenant_id, targetDatetime, target_time, duration_hours, service_type || 'General']);
      
      const parsed = result.rows.map(row => {
        let is_available = true;
        let availability_reason = '';
        let compliance_status = 'compliant'; // 'compliant', 'warning', 'non_compliant'
        
        // 1. Hard Compliance Lock (Level 1)
        if (parseInt(row.missing_mandatory_quals) > 0) {
          is_available = false;
          compliance_status = 'non_compliant';
          availability_reason = 'Illegal (Missing Mandatory Compliance)';
        }
        
        // 2. Fundamental Availability Logic
        if (is_available) {
          if (!row.is_baseline_available) {
            is_available = false;
            availability_reason = 'Outside contracted hours';
          } else if (parseInt(row.leave_conflicts) > 0) {
            is_available = false;
            availability_reason = 'On Leave / Time off';
          } else if (parseInt(row.schedule_conflicts) > 0) {
            is_available = false;
            availability_reason = 'Double-booked';
          } else {
            availability_reason = `${row.baseline_start?.substring(0,5) || '00:00'} \u2013 ${row.baseline_end?.substring(0,5) || '23:59'}`;
          }
        }
        
        // 3. Logistics Calculation
        const distanceKm = calculateDistance(row.home_suburb || 'Hobart', target_suburb || 'Hobart');
        const travelTimeMin = getTravelTime(distanceKm);
        const withinTravelRadius = distanceKm <= (row.max_travel_km || 30);

        if (is_available && !withinTravelRadius) {
           is_available = false;
           availability_reason = `Exceeds max travel (${distanceKm}km)`;
        }

        // 4. Service Authorization Warning
        const authorized = parseInt(row.is_authorized_for_service) > 0;
        if (is_available && !authorized) {
          compliance_status = 'warning';
          // We don't mark as unavailable, just lower score and warn
        }

        // 5. Scoring Engine (Capability Matching Score)
        let logisticalScore = is_available ? 80 : 0;
        if (is_available) {
          logisticalScore += (authorized ? 20 : 0); // Skill match bonus
          logisticalScore -= (distanceKm * 1.5); // Proximity penalty
          if (row.has_car && service_type === 'Transport') logisticalScore += 10;
        }

        return {
          id: row.id,
          name: row.name,
          qualifications: row.qualifications,
          service_areas: row.service_areas,
          home_suburb: row.home_suburb,
          distance_km: distanceKm,
          travel_time_min: travelTimeMin,
          logistical_score: Math.max(0, Math.round(logisticalScore)),
          is_available,
          availability_reason,
          compliance_status,
          is_authorized: authorized
        };
      });

      // Sort by score (Ranked recommendations)
      parsed.sort((a, b) => b.logistical_score - a.logistical_score);

      return res.json(parsed);

    } else {
      const tenant_id = req.user.tenant_id;
      const result = await pool.query(
        `SELECT * FROM support_workers WHERE tenant_id = $1 AND is_active = true`,
        [tenant_id]
      );
      // Give them a default for the sake of the grid outside the modal if needed
      const mapped = result.rows.map(r => ({ ...r, is_available: true, availability_reason: 'Unknown' }));
      return res.json(mapped);
    }
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ error: 'Failed to fetch workers', detail: error.message });
  }
};

export const getWeeklySchedule = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const { start_date, end_date } = req.query;
    const result = await pool.query(
      `SELECT * FROM schedules WHERE tenant_id = $1 AND scheduled_at BETWEEN $2 AND $3 ORDER BY scheduled_at ASC`,
      [tenant_id, start_date, end_date]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch weekly schedule', detail: error.message });
  }
};

export const createVisit = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const { client_id, worker_id, service_type, scheduled_at, duration_hours, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO schedules (tenant_id, client_id, worker_id, service_type, scheduled_at, duration_hours, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled') RETURNING *`,
      [tenant_id, client_id, worker_id, service_type, scheduled_at, duration_hours, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating visit:', error);
    res.status(500).json({ error: 'Failed to schedule visit', detail: error.message });
  }
};
