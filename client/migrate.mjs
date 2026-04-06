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
  is_active BOOLEAN DEFAULT TRUE,
  home_suburb VARCHAR(100),
  max_travel_km INTEGER DEFAULT 30,
  phone VARCHAR(30),
  email VARCHAR(255),
  employment_type VARCHAR(50) DEFAULT 'Casual',
  has_car BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Qualification Types (Goverment vs Agency)
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

-- Seed Mandatory Qualification Types
INSERT INTO qualification_types (name, is_government_locked, is_mandatory)
VALUES 
  ('NDIS Worker Screening Check', TRUE, TRUE),
  ('Police Check', TRUE, TRUE),
  ('First Aid / CPR', TRUE, TRUE),
  ('Manual Handling', FALSE, TRUE),
  ('Dementia Care Training', FALSE, FALSE),
  ('Medication Administration', FALSE, FALSE)
ON CONFLICT (name) DO NOTHING;

-- Seed Sample Support Workers with extended data
INSERT INTO support_workers (tenant_id, name, qualifications, service_areas, home_suburb, max_travel_km, phone, email, employment_type, has_car)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'Sarah O''Brien', 'Cert III Individual Support', ARRAY['Hobart','Kingston'], 'Kingston', 25, '0400111222', 'sarah.o@tascare.com.au', 'Part-time', TRUE),
  ('00000000-0000-0000-0000-000000000000', 'Michael Chang', 'Cert IV Ageing Support', ARRAY['Glenorchy','Hobart'], 'Glenorchy', 35, '0400333444', 'michael.c@tascare.com.au', 'Casual', TRUE),
  ('00000000-0000-0000-0000-000000000000', 'Aroha Williams', 'EN', ARRAY['Clarence','Hobart'], 'Bellerive', 40, '0400555666', 'aroha.w@tascare.com.au', 'Full-time', FALSE)
ON CONFLICT DO NOTHING;

-- Seed Sample Service Authorizations
INSERT INTO worker_services (worker_id, service_type)
SELECT id, 'Personal Care' FROM support_workers WHERE name = 'Sarah O''Brien'
ON CONFLICT DO NOTHING;
INSERT INTO worker_services (worker_id, service_type)
SELECT id, 'Community Access' FROM support_workers WHERE name = 'Sarah O''Brien'
ON CONFLICT DO NOTHING;
INSERT INTO worker_services (worker_id, service_type)
SELECT id, 'Nursing Care' FROM support_workers WHERE name = 'Aroha Williams'
ON CONFLICT DO NOTHING;

-- Seed Sample Qualifications (Valid)
INSERT INTO worker_qualifications (worker_id, type_id, expiry_date, verified)
SELECT w.id, q.id, '2027-01-01', TRUE 
FROM support_workers w, qualification_types q
WHERE w.name = 'Sarah O''Brien' AND q.name = 'Police Check'
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
