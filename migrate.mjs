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
  state VARCHAR(50) DEFAULT 'Tasmania',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
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

-- Support Workers
CREATE TABLE IF NOT EXISTS support_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  qualifications TEXT,
  service_areas TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
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

-- Default Tenant Seed
INSERT INTO tenants (id, name, state)
VALUES ('00000000-0000-0000-0000-000000000000', 'TasCare South (Demo)', 'Tasmania')
ON CONFLICT (id) DO NOTHING;

-- Sample Support Workers
INSERT INTO support_workers (tenant_id, name, qualifications, service_areas)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'Sarah O''Brien', 'Certificate III in Individual Support', ARRAY['Hobart','Kingston']),
  ('00000000-0000-0000-0000-000000000000', 'Michael Chang', 'Certificate IV in Ageing Support', ARRAY['Glenorchy','Hobart']),
  ('00000000-0000-0000-0000-000000000000', 'Aroha Williams', 'Enrolled Nurse', ARRAY['Clarence','Hobart'])
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
    console.error('❌ Full error:', JSON.stringify(err, null, 2));
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
