import { db } from '../index.js';
import { parseReferral } from '../services/aiService.js';

export const createReferral = async (req, res) => {
  try {
    const { tenant_id, client_name, dob, funding_type, hcp_level, my_aged_care_id, referral_source, summary, raw_data } = req.body;
    
    const [referral] = await db('referrals').insert({
      tenant_id,
      client_name,
      dob,
      funding_type,
      hcp_level,
      my_aged_care_id,
      referral_source,
      summary,
      raw_data: JSON.stringify(raw_data),
      status: 'new'
    }).returning('*');

    res.status(201).json(referral);
  } catch (error) {
    console.error('Error creating referral:', error);
    res.status(500).json({ error: 'Failed to create referral' });
  }
};

export const getReferrals = async (req, res) => {
  try {
    const { tenant_id } = req.query;
    const referrals = await db('referrals')
      .where({ tenant_id })
      .orderBy('created_at', 'desc');
    
    res.json(referrals);
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
};

export const updateReferralStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const [referral] = await db('referrals')
      .where({ id })
      .update({ status, updated_at: db.fn.now() })
      .returning('*');
    
    res.json(referral);
  } catch (error) {
    console.error('Error updating referral status:', error);
    res.status(500).json({ error: 'Failed to update referral status' });
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
    res.status(500).json({ error: 'AI was unable to parse this document' });
  }
};
