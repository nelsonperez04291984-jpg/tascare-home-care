import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from '../api-lib/db.js';
import referralRoutes from '../api-lib/routes/referralRoutes.js';
import careSchedulingRoutes from '../api-lib/routes/careSchedulingRoutes.js';
import adminRoutes from '../api-lib/routes/adminRoutes.js';
import authRoutes from '../api-lib/routes/authRoutes.js';
import billingRoutes from '../api-lib/routes/billingRoutes.js';
import analyticsRoutes from '../api-lib/routes/analyticsRoutes.js';
import { authMiddleware } from '../api-lib/middleware/authMiddleware.js';

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

// DB setup — visit /api/migrate?key=YOUR_SECRET in browser to create tables
app.get('/api/migrate', async (req, res) => {
  const { key } = req.query;
  const ADMIN_MIGRATE_KEY = process.env.ADMIN_MIGRATE_KEY || 'tascare-dev-reset-2024';
  
  if (key !== ADMIN_MIGRATE_KEY) {
    return res.status(403).json({ error: 'Unauthorized migration request. Invalid Key.' });
  }

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
        gender VARCHAR(50),
        aboriginal_status VARCHAR(100),
        disability_status VARCHAR(100),
        country_of_birth VARCHAR(100),
        language_spoken VARCHAR(100),
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
      -- Migration: add columns to existing table
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS aboriginal_status VARCHAR(100);
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS disability_status VARCHAR(100);
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS country_of_birth VARCHAR(100);
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS language_spoken VARCHAR(100);
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS suburb VARCHAR(100);
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS postcode VARCHAR(10);
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255);
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(30);
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100);
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS requested_services TEXT[];
      ALTER TABLE referrals ADD COLUMN IF NOT EXISTS raw_data JSONB;
      
      -- Support Workers (Phase 9 Upgrade)
      ALTER TABLE support_workers ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
      ALTER TABLE support_workers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
      ALTER TABLE support_workers ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50);
      ALTER TABLE support_workers ADD COLUMN IF NOT EXISTS has_car BOOLEAN DEFAULT FALSE;
      ALTER TABLE support_workers ADD COLUMN IF NOT EXISTS home_suburb VARCHAR(100);
      ALTER TABLE support_workers ADD COLUMN IF NOT EXISTS max_travel_km INTEGER DEFAULT 30;
      ALTER TABLE support_workers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

      -- Qualification Types
      CREATE TABLE IF NOT EXISTS qualification_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        is_government_locked BOOLEAN DEFAULT FALSE,
        is_mandatory BOOLEAN DEFAULT FALSE
      );

      -- Worker Qualifications
      CREATE TABLE IF NOT EXISTS worker_qualifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        worker_id UUID REFERENCES support_workers(id) ON DELETE CASCADE,
        type_id UUID REFERENCES qualification_types(id) ON DELETE CASCADE,
        expiry_date DATE,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Worker Authorized Services
      CREATE TABLE IF NOT EXISTS worker_services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        worker_id UUID REFERENCES support_workers(id) ON DELETE CASCADE,
        service_type VARCHAR(100) NOT NULL,
        competency_level INTEGER DEFAULT 1,
        UNIQUE(worker_id, service_type)
      );

      -- Support Worker Availability (Phase 10: Structural MVP)
      CREATE TABLE IF NOT EXISTS worker_availability (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        worker_id UUID REFERENCES support_workers(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL, -- 0 (Sun) to 6 (Sat)
        start_time TIME WITHOUT TIME ZONE,
        end_time TIME WITHOUT TIME ZONE,
        active BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(worker_id, day_of_week)
      );
      
      INSERT INTO tenants (id, name, subdomain, state)
      VALUES ('00000000-0000-0000-0000-000000000000', 'TasCare South (Demo)', 'tascare-south', 'Tasmania')
      ON CONFLICT (id) DO NOTHING;

      -- Seed Mandatory Qualifications
      INSERT INTO qualification_types (name, is_government_locked, is_mandatory)
      VALUES 
        ('NDIS Worker Screening Check', TRUE, TRUE),
        ('Police Check', TRUE, TRUE),
        ('First Aid / CPR', TRUE, TRUE),
        ('Manual Handling', FALSE, TRUE)
      ON CONFLICT (name) DO NOTHING;

      INSERT INTO support_workers (tenant_id, name, qualifications, service_areas, home_suburb, max_travel_km, employment_type, has_car)
      VALUES 
        ('00000000-0000-0000-0000-000000000000', 'Sarah O''Brien', 'Cert III', ARRAY['Hobart','Kingston'], 'Kingston', 25, 'Part-time', TRUE),
        ('00000000-0000-0000-0000-000000000000', 'Michael Chang', 'Cert IV', ARRAY['Glenorchy','Hobart'], 'Glenorchy', 35, 'Casual', TRUE),
        ('00000000-0000-0000-0000-000000000000', 'Aroha Williams', 'RN', ARRAY['Clarence','Hobart'], 'Bellerive', 40, 'Full-time', FALSE)
      ON CONFLICT DO NOTHING;

      INSERT INTO referrals (tenant_id, client_name, dob, gender, funding_type, hcp_level, my_aged_care_id, referral_source, service_area, summary, status)
      VALUES 
        ('00000000-0000-0000-0000-000000000000', 'John Smith', '1945-05-20', 'Male', 'HCP', 3, '1-882736', 'Royal Hobart Hospital', 'Hobart', 'Post-discharge support. High fall risk. Needs help with showering and meal prep 3x weekly.', 'accepted'),
        ('00000000-0000-0000-0000-000000000000', 'Mary Brown', '1938-11-12', 'Female', 'CHSP', NULL, NULL, 'Family Enquiry', 'Kingston', 'Daughter enquiring about social support and transport for shopping.', 'contacted'),
        ('00000000-0000-0000-0000-000000000000', 'Robert Lee', '1940-03-08', 'Male', 'HCP', 2, '1-994421', 'GP Referral', 'Glenorchy', 'Mild dementia. Requires medication reminders and companionship twice weekly.', 'assessment_scheduled')
      ON CONFLICT DO NOTHING;
      
      -- Seed availability ONLY for demo workers (Sarah, Michael, Aroha)
      INSERT INTO worker_availability (worker_id, day_of_week, start_time, end_time, active)
      SELECT id, d.day_of_week, '09:00:00', '17:00:00', TRUE
      FROM support_workers
      CROSS JOIN generate_series(1, 5) AS d(day_of_week)
      WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
      ON CONFLICT (worker_id, day_of_week) DO NOTHING;
    `);
    res.json({ success: true, message: '✅ All tables created and seeded with availability engine data!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Routes
app.use('/api/auth', authRoutes);

// Protected Clinical & Admin Routes (Multi-tenant enforced)
app.use('/api/referrals', authMiddleware, referralRoutes);
app.use('/api/care-scheduling', authMiddleware, careSchedulingRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/billing', authMiddleware, billingRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);

// Export for Vercel Serverless — no app.listen()
export default app;
