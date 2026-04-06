import pool from '../db.js';
import { parseReferral } from '../services/aiService.js';

export const createReferral = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const { client_name, dob, funding_type, hcp_level, my_aged_care_id, referral_source, summary, service_area } = req.body;
    
    const result = await pool.query(
      `INSERT INTO referrals (tenant_id, client_name, dob, funding_type, hcp_level, my_aged_care_id, referral_source, summary, service_area, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'new') RETURNING *`,
      [tenant_id, client_name, dob || null, funding_type, hcp_level || null, my_aged_care_id, referral_source, summary, service_area]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating referral:', error);
    res.status(500).json({ error: 'Failed to create referral', detail: error.message });
  }
};

export const getReferrals = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const result = await pool.query(
      `SELECT * FROM referrals WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenant_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({ error: 'Failed to fetch referrals', detail: error.message });
  }
};

export const getReferralById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenant_id = req.user.tenant_id;
    const result = await pool.query(
      `SELECT * FROM referrals WHERE id = $1 AND tenant_id = $2`,
      [id, tenant_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Referral not found or unauthorized' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching referral by ID:', error);
    res.status(500).json({ error: 'Failed to fetch referral', detail: error.message });
  }
};

export const updateReferralStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const tenant_id = req.user.tenant_id;

    const result = await pool.query(
      `UPDATE referrals SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [status, id, tenant_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Referral not found or unauthorized' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating referral status:', error);
    res.status(500).json({ error: 'Failed to update referral status', detail: error.message });
  }
};

export const processAIIntake = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const aiData = await parseReferral(req.file.buffer, req.file.mimetype);
    res.json(aiData);
  } catch (error) {
    console.error('AI Intake Processing Error:', error);
    res.status(500).json({ error: 'AI was unable to parse this document', detail: error.message });
  }
};
