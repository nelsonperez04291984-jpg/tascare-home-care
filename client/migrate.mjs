import pg from 'pg';

const { Client } = pg;

const DATABASE_URL = "postgresql://neondb_owner:npg_mq2QEawrlt5M@ep-rough-leaf-amb40a15.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const SQL = `
-- Tenants
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE,
  state VARCHAR(50) DEFAULT 'Tasmania',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
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

-- Referrals (full Australian intake fields)
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

-- Support Workers
CREATE TABLE IF NOT EXISTS support_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  qualifications TEXT,
  service_areas TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  home_suburb VARCHAR(100),
  max_travel_km INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Care Plans
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

-- Schedules
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

-- Clinical Documents (Vercel Blob references)
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

-- Default Tenant Seed
INSERT INTO tenants (id, name, subdomain, state)
VALUES ('00000000-0000-0000-0000-000000000000', 'TasCare South (Demo)', 'tascare-south', 'Tasmania')
ON CONFLICT (id) DO NOTHING;

-- Sample Support Workers
INSERT INTO support_workers (tenant_id, name, qualifications, service_areas, home_suburb, max_travel_km)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'Sarah O''Brien', 'Certificate III in Individual Support', ARRAY['Hobart','Kingston'], 'Kingston', 25),
  ('00000000-0000-0000-0000-000000000000', 'Michael Chang', 'Certificate IV in Ageing Support', ARRAY['Glenorchy','Hobart'], 'Glenorchy', 35),
  ('00000000-0000-0000-0000-000000000000', 'Aroha Williams', 'Enrolled Nurse', ARRAY['Clarence','Hobart'], 'Bellerive', 40)
ON CONFLICT DO NOTHING;

-- Sample Referrals (demo data)
INSERT INTO referrals (tenant_id, client_name, dob, funding_type, hcp_level, my_aged_care_id, referral_source, service_area, summary, status)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'John Smith', '1945-05-20', 'HCP', 3, '1-882736', 'Royal Hobart Hospital', 'Hobart', 'Post-discharge support. High fall risk. Needs help with showering and meal prep 3x weekly.', 'new'),
  ('00000000-0000-0000-0000-000000000000', 'Mary Brown', '1938-11-12', 'CHSP', NULL, NULL, 'Family Enquiry', 'Kingston', 'Daughter enquiring about social support and transport for shopping in Kingston area.', 'contacted'),
  ('00000000-0000-0000-0000-000000000000', 'Robert Lee', '1940-03-08', 'HCP', 2, '1-994421', 'GP Referral', 'Glenorchy', 'Mild dementia. Requires medication reminders and companionship visits twice weekly.', 'assessment_scheduled')
ON CONFLICT DO NOTHING;
`;

async function run() {
  try {
    await client.connect();
    console.log('✅ Connected to Neon database!');
    await client.query(SQL);
    console.log('✅ All tables created and seeded successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
