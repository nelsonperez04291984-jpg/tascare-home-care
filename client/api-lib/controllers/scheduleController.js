import pool from '../db.js';

export const getSupportWorkers = async (req, res) => {
  try {
    const { tenant_id, target_date, target_time, duration_hours } = req.query;

    if (target_date && target_time && duration_hours) {
      const targetDatetime = `${target_date} ${target_time}:00`;
      
      const query = `
        SELECT w.id, w.name, w.qualifications, w.service_areas,
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
               ) as leave_conflicts
               
        FROM support_workers w
        LEFT JOIN worker_availability wa 
               ON wa.worker_id = w.id 
              AND wa.day_of_week = EXTRACT(DOW FROM $2::timestamp)
        WHERE w.tenant_id = $1 AND w.is_active = true
      `;
      
      const result = await pool.query(query, [tenant_id, targetDatetime, target_time, duration_hours]);
      
      const parsed = result.rows.map(row => {
        let is_available = true;
        let availability_reason = '';
        
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
        
        return {
          id: row.id,
          name: row.name,
          qualifications: row.qualifications,
          service_areas: row.service_areas,
          is_available,
          availability_reason
        };
      });
      return res.json(parsed);

    } else {
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
    const { tenant_id, start_date, end_date } = req.query;
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
    const { tenant_id, client_id, worker_id, service_type, scheduled_at, duration_hours, notes } = req.body;
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
