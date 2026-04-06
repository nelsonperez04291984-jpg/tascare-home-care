import pool from '../db.js';
import bcrypt from 'bcryptjs';

export const getUsers = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const result = await pool.query(`SELECT id, email, name, role, created_at FROM users WHERE tenant_id = $1 ORDER BY created_at DESC`, [tenant_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users', detail: error.message, code: error.code });
  }
};

export const createUser = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const { name, email, password, role } = req.body;
    const password_hash = await bcrypt.hash(password || 'password123', 10);
    const result = await pool.query(
      `INSERT INTO users (tenant_id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role`,
      [tenant_id, name, email, password_hash, role || 'coordinator']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to create user:', error);
    res.status(500).json({ error: 'Failed to create user', detail: error.message, code: error.code });
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

export const getQualificationTypes = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM qualification_types ORDER BY is_mandatory DESC, name ASC`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch qualification types', detail: error.message });
  }
};

export const createWorker = async (req, res) => {
  const client = await pool.connect();
  try {
    const tenant_id = req.user.tenant_id;
    if (!tenant_id) {
      return res.status(401).json({ error: 'Your session is missing an Organization ID. Please Log out and Log back in.' });
    }

    const { 
      name, home_suburb, max_travel_km, phone, email, 
      employment_type, has_car, services, qualifications 
    } = req.body;

    await client.query('BEGIN');

    // 1. Insert Base Worker
    const workerRes = await client.query(
      `INSERT INTO support_workers (tenant_id, name, home_suburb, max_travel_km, phone, email, employment_type, has_car, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) RETURNING id`,
      [tenant_id, name, home_suburb, max_travel_km || 30, phone, email, employment_type || 'Casual', has_car || false]
    );
    const workerId = workerRes.rows[0].id;
    console.log(`[SYSTEM] Worker ${name} created with ID ${workerId} for tenant ${tenant_id}`);

    // 2. Insert Services
    if (services && Array.isArray(services)) {
      for (const service of services) {
        await client.query(
          `INSERT INTO worker_services (worker_id, service_type) VALUES ($1, $2)`,
          [workerId, service]
        );
      }
    }

    // 3. Insert Qualifications
    if (qualifications && Array.isArray(qualifications)) {
      for (const qual of qualifications) {
        if (qual.type_id) {
          await client.query(
            `INSERT INTO worker_qualifications (worker_id, type_id, expiry_date, verified) 
             VALUES ($1, $2, $3, $4)`,
            [workerId, qual.type_id, qual.expiry_date || null, qual.verified || false]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ id: workerId, name });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Failed to create worker:', error);
    res.status(500).json({ 
      error: 'Failed to create worker', 
      detail: error.message,
      code: error.code // Include PG error code if available
    });
  } finally {
    if (client) client.release();
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

export const getTenant = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const result = await pool.query(`SELECT * FROM tenants WHERE id = $1`, [tenant_id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to fetch tenant:', error);
    res.status(500).json({ error: 'Failed to fetch tenant settings', detail: error.message, code: error.code });
  }
};

export const updateTenant = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const { name, subdomain, state } = req.body;
    const result = await pool.query(
      `UPDATE tenants SET name = $1, subdomain = $2, state = $3 WHERE id = $4 RETURNING *`,
      [name, subdomain, state, tenant_id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update tenant:', error);
    res.status(500).json({ error: 'Failed to update organization settings', detail: error.message, code: error.code });
  }
};

export const repairDatabase = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    if (!tenant_id) throw new Error('Cannot repair: Your account is missing a Tenant ID. Please Log out and Log in again.');

    // 1. Repair rows (Both status and ghosted tenant_ids)
    const repairResult = await pool.query(
      `UPDATE support_workers 
       SET is_active = true, 
           tenant_id = COALESCE(tenant_id, $1) 
       WHERE is_active IS NULL OR tenant_id IS NULL`, 
      [tenant_id]
    );
    
    // 2. Diagnostics
    const tenantCount = await pool.query(`SELECT COUNT(*) FROM support_workers WHERE tenant_id = $1`, [tenant_id]);
    const globalCount = await pool.query(`SELECT COUNT(*) FROM support_workers`);
    
    res.json({ 
      success: true, 
      message: `✅ Repair complete. [ID: ${tenant_id}]`,
      detail: `Your Tenant: ${tenantCount.rows[0].count} workers. Global Total: ${globalCount.rows[0].count} workers. Repaired: ${repairResult.rowCount}`
    });
  } catch (error) {
    console.error('Repair failed:', error);
    res.status(500).json({ error: 'Repair failed', detail: error.message });
  }
};
