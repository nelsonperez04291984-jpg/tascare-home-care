import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from '../api-lib/db.js';
import referralRoutes from '../api-lib/routes/referralRoutes.js';
import careSchedulingRoutes from '../api-lib/routes/careSchedulingRoutes.js';
import adminRoutes from '../api-lib/routes/adminRoutes.js';
import authRoutes from '../api-lib/routes/authRoutes.js';

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

// DB setup — visit /api/migrate in browser to create all tables
app.get('/api/migrate', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(100) UNIQUE,
        state VARCHAR(50) DEFAULT 'Tasmania',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'coordinator',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id),
        client_name VARCHAR(255) NOT NULL,
        dob DATE,
        my_aged_care_id VARCHAR(50),
        phone VARCHAR(30),
        address TEXT,
        suburb VARCHAR(100),
        postcode VARCHAR(10),
        emergency_contact_name VARCHAR(255),
        emergency_contact_phone VARCHAR(30),
        emergency_contact_relationship VARCHAR(100),
        funding_type VARCHAR(50) DEFAULT 'Unknown',
        hcp_level INTEGER,
        referral_source VARCHAR(255),
        requested_services TEXT[],
        summary TEXT,
        service_area VARCHAR(100) DEFAULT 'Hobart',
        status VARCHAR(50) DEFAULT 'new',
        raw_data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS support_workers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id),
        name VARCHAR(255) NOT NULL,
        qualifications TEXT,
        service_areas TEXT[],
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS care_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id),
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
        tenant_id UUID REFERENCES tenants(id),
        client_id UUID,
        worker_id UUID REFERENCES support_workers(id),
        service_type VARCHAR(100),
        scheduled_at TIMESTAMPTZ NOT NULL,
        duration_hours NUMERIC(4,2),
        status VARCHAR(50) DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS clinical_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id),
        referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        blob_url TEXT NOT NULL,
        blob_pathname TEXT,
        content_type VARCHAR(100),
        size_bytes INTEGER,
        uploaded_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subdomain VARCHAR(100) UNIQUE;
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS suburb VARCHAR(100);
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS postcode VARCHAR(10);
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255);
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(30);
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100);
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS requested_services TEXT[];
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS raw_data JSONB;
      INSERT INTO tenants (id, name, subdomain, state)
      VALUES ('00000000-0000-0000-0000-000000000000', 'TasCare South (Demo)', 'tascare-south', 'Tasmania')
      ON CONFLICT (id) DO NOTHING;
      INSERT INTO support_workers (tenant_id, name, qualifications, service_areas)
      VALUES 
        ('00000000-0000-0000-0000-000000000000', 'Sarah O''Brien', 'Certificate III in Individual Support', ARRAY['Hobart','Kingston']),
        ('00000000-0000-0000-0000-000000000000', 'Michael Chang', 'Certificate IV in Ageing Support', ARRAY['Glenorchy','Hobart']),
        ('00000000-0000-0000-0000-000000000000', 'Aroha Williams', 'Enrolled Nurse', ARRAY['Clarence','Hobart'])
      ON CONFLICT DO NOTHING;
      INSERT INTO referrals (tenant_id, client_name, dob, funding_type, hcp_level, my_aged_care_id, referral_source, service_area, summary, status)
      VALUES 
        ('00000000-0000-0000-0000-000000000000', 'John Smith', '1945-05-20', 'HCP', 3, '1-882736', 'Royal Hobart Hospital', 'Hobart', 'Post-discharge support. High fall risk. Needs help with showering and meal prep 3x weekly.', 'new'),
        ('00000000-0000-0000-0000-000000000000', 'Mary Brown', '1938-11-12', 'CHSP', NULL, NULL, 'Family Enquiry', 'Kingston', 'Daughter enquiring about social support and transport for shopping.', 'contacted'),
        ('00000000-0000-0000-0000-000000000000', 'Robert Lee', '1940-03-08', 'HCP', 2, '1-994421', 'GP Referral', 'Glenorchy', 'Mild dementia. Requires medication reminders and companionship twice weekly.', 'assessment_scheduled')
      ON CONFLICT DO NOTHING;
    `);
    res.json({ success: true, message: '✅ All tables created and seeded with demo data!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/care-scheduling', careSchedulingRoutes);
app.use('/api/admin', adminRoutes);

// Export for Vercel Serverless — no app.listen()
export default app;
