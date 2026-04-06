import pool from '../db.js';

export const getSupportWorkers = async (req, res) => {
  try {
    const { tenant_id } = req.query;
    const result = await pool.query(
      `SELECT * FROM support_workers WHERE tenant_id = $1 AND is_active = true`,
      [tenant_id]
    );
    res.json(result.rows);
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
