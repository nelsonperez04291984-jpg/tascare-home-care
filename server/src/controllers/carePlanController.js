import { db } from '../index.js';

/**
 * Care Plan Controller for HCP/CHSP management
 */
export const createCarePlan = async (req, res) => {
  try {
    const { client_id, tenant_id, goals, services, monthly_budget } = req.body;
    
    // First, link the referral/intake data to a client record if not already done
    // For now, assume client_id is passed correctly
    const [carePlan] = await db('care_plans').insert({
      client_id,
      tenant_id,
      goals: JSON.stringify(goals),
      services: JSON.stringify(services),
      monthly_budget,
      status: 'active'
    }).returning('*');

    res.status(201).json(carePlan);
  } catch (error) {
    console.error('Error creating care plan:', error);
    res.status(500).json({ error: 'Failed to create care plan' });
  }
};

export const getClientCarePlan = async (req, res) => {
  try {
    const { client_id } = req.params;
    const carePlan = await db('care_plans')
      .where({ client_id, status: 'active' })
      .first();
    
    res.json(carePlan);
  } catch (error) {
    console.error('Error fetching care plan:', error);
    res.status(500).json({ error: 'Failed to fetch care plan' });
  }
};

export const updateCarePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { goals, services, monthly_budget, status } = req.body;
    
    const [updatedPlan] = await db('care_plans')
      .where({ id })
      .update({
        goals: JSON.stringify(goals),
        services: JSON.stringify(services),
        monthly_budget,
        status,
        updated_at: db.fn.now()
      })
      .returning('*');
    
    res.json(updatedPlan);
  } catch (error) {
    console.error('Error updating care plan:', error);
    res.status(500).json({ error: 'Failed to update care plan' });
  }
};
