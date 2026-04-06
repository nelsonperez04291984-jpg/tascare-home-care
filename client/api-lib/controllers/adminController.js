import pool from '../db.js';
import bcrypt from 'bcryptjs';

export const getUsers = async (req, res) => {
  try {
    const { tenant_id } = req.query;
    const result = await pool.query(`SELECT id, email, name, role, created_at FROM users WHERE tenant_id = $1 ORDER BY created_at DESC`, [tenant_id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', detail: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { tenant_id, name, email, password, role } = req.body;
    const password_hash = await bcrypt.hash(password || 'password123', 10);
    const result = await pool.query(
      `INSERT INTO users (tenant_id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role`,
      [tenant_id, name, email, password_hash, role || 'coordinator']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user', detail: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user', detail: error.message });
  }
};

export const createWorker = async (req, res) => {
  try {
    const { tenant_id, name, qualifications, service_areas } = req.body;
    const result = await pool.query(
      `INSERT INTO support_workers (tenant_id, name, qualifications, service_areas) VALUES ($1, $2, $3, $4) RETURNING *`,
      [tenant_id, name, qualifications, service_areas]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create worker', detail: error.message });
  }
};

export const deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM support_workers WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete worker', detail: error.message });
  }
};
