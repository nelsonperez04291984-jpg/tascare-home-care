import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import referralRoutes from './routes/referralRoutes.js';
import careSchedulingRoutes from './routes/careSchedulingRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', env: process.env.NODE_ENV });
  } catch (e) {
    res.status(500).json({ status: 'error', db: 'disconnected', detail: e.message });
  }
});

// One-time DB setup — visit /api/migrate in browser to create all tables
app.get('/api/migrate', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        state VARCHAR(50) DEFAULT 'Tasmania',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID,
        client_name VARCHAR(255) NOT NULL,
        dob DATE,
        my_aged_care_id VARCHAR(50),
        funding_type VARCHAR(50) DEFAULT 'Unknown',
        hcp_level INTEGER,
        referral_source VARCHAR(255),
        summary TEXT,
        service_area VARCHAR(100) DEFAULT 'Hobart',
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS support_workers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID,
        name VARCHAR(255) NOT NULL,
        qualifications TEXT,
        service_areas TEXT[],
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS care_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID,
        client_id UUID,
        goals JSONB DEFAULT '[]',
        services JSONB DEFAULT '[]',
        monthly_budget NUMERIC(10,2),
        hcp_level INTEGER,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID,
        client_id UUID,
        worker_id UUID,
        service_type VARCHAR(100),
        scheduled_at TIMESTAMPTZ NOT NULL,
        duration_hours NUMERIC(4,2),
        status VARCHAR(50) DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      INSERT INTO tenants (id, name, state)
      VALUES ('00000000-0000-0000-0000-000000000000', 'TasCare South (Demo)', 'Tasmania')
      ON CONFLICT (id) DO NOTHING;
      INSERT INTO support_workers (tenant_id, name, qualifications, service_areas)
      VALUES 
        ('00000000-0000-0000-0000-000000000000', 'Sarah O''Brien', 'Certificate III in Individual Support', ARRAY['Hobart','Kingston']),
        ('00000000-0000-0000-0000-000000000000', 'Michael Chang', 'Certificate IV in Ageing Support', ARRAY['Glenorchy','Hobart']),
        ('00000000-0000-0000-0000-000000000000', 'Aroha Williams', 'Enrolled Nurse', ARRAY['Clarence','Hobart'])
      ON CONFLICT DO NOTHING;
    `);
    res.json({ success: true, message: '✅ All tables created and seeded!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Routes
app.use('/api/referrals', referralRoutes);
app.use('/api/care-scheduling', careSchedulingRoutes);

// Export for Vercel Serverless — no app.listen()
export default app;
