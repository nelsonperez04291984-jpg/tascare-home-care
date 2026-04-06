import { db } from '../index.js';

/**
 * Schedule Controller for Support Worker Visits
 */
export const createVisit = async (req, res) => {
  try {
    const { tenant_id, client_id, worker_id, care_plan_id, service_type, start_time, end_time, notes } = req.body;
    
    // Check for worker conflicts
    const conflict = await db('schedules')
      .where({ worker_id, status: 'planned' })
      .where('start_time', '<', end_time)
      .where('end_time', '>', start_time)
      .first();

    if (conflict) {
      return res.status(409).json({ error: 'Support worker is already booked for this time period' });
    }

    const [visit] = await db('schedules').insert({
      tenant_id,
      client_id,
      worker_id,
      care_plan_id,
      service_type,
      start_time,
      end_time,
      notes,
      status: 'planned'
    }).returning('*');

    res.status(201).json(visit);
  } catch (error) {
    console.error('Error creating visit:', error);
    res.status(500).json({ error: 'Failed to schedule visit' });
  }
};

export const getWeeklySchedule = async (req, res) => {
  try {
    const { tenant_id, start_date, end_date } = req.query;
    const visits = await db('schedules')
      .where({ tenant_id })
      .whereBetween('start_time', [start_date, end_date])
      .join('clients', 'schedules.client_id', 'clients.id')
      .join('support_workers', 'schedules.worker_id', 'support_workers.id')
      .select(
        'schedules.*',
        'clients.name as client_name',
        'support_workers.name as worker_name'
      )
      .orderBy('start_time', 'asc');
    
    res.json(visits);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch weekly schedule' });
  }
};

export const getSupportWorkers = async (req, res) => {
  try {
    const { tenant_id } = req.query;
    const workers = await db('support_workers')
      .where({ tenant_id, is_active: true });
    
    res.json(workers);
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
};
