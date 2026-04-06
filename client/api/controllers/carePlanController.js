import pool from '../db.js';

export const createCarePlan = async (req, res) => {
  try {
    const { tenant_id, client_id, goals, services, monthly_budget, hcp_level } = req.body;
    const result = await pool.query(
      `INSERT INTO care_plans (tenant_id, client_id, goals, services, monthly_budget, hcp_level, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active') RETURNING *`,
      [tenant_id, client_id, JSON.stringify(goals), JSON.stringify(services), monthly_budget, hcp_level]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating care plan:', error);
    res.status(500).json({ error: 'Failed to create care plan', detail: error.message });
  }
};

export const getClientCarePlan = async (req, res) => {
  try {
    const { client_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM care_plans WHERE client_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
      [client_id]
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching care plan:', error);
    res.status(500).json({ error: 'Failed to fetch care plan', detail: error.message });
  }
};

export const updateCarePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { goals, services, monthly_budget } = req.body;
    const result = await pool.query(
      `UPDATE care_plans SET goals = $1, services = $2, monthly_budget = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
      [JSON.stringify(goals), JSON.stringify(services), monthly_budget, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating care plan:', error);
    res.status(500).json({ error: 'Failed to update care plan', detail: error.message });
  }
};
