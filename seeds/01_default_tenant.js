/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex('referrals').del();
  await knex('users').del();
  await knex('tenants').del();

  const [tenant] = await knex('tenants').insert({
    id: '00000000-0000-0000-0000-000000000000',
    name: 'TasCare South',
    subdomain: 'tascare-south'
  }).returning('*');

  await knex('users').insert([
    {
      tenant_id: tenant.id,
      email: 'admin@tascare.com.au',
      password_hash: 'hashed_password', // In real app, bcrypt it
      name: 'Admin User',
      role: 'admin'
    }
  ]);

  await knex('referrals').insert([
    {
      tenant_id: tenant.id,
      client_name: 'John Smith',
      dob: '1945-05-20',
      funding_type: 'HCP',
      hcp_level: 3,
      my_aged_care_id: '1-882736',
      status: 'new',
      referral_source: 'Royal Hobart Hospital',
      summary: 'Patient requires post-discharge support. High fall risk. Needs help with showering and meal prep 3x weekly.',
      raw_data: JSON.stringify({ note: 'Urgent discharge' })
    },
    {
      tenant_id: tenant.id,
      client_name: 'Mary Brown',
      dob: '1938-11-12',
      funding_type: 'CHSP',
      status: 'contacted',
      referral_source: 'Family Enquiry',
      summary: 'Daughter inquiring about social support and transport for shopping in Kingston area.',
      raw_data: JSON.stringify({ note: 'Prefers morning visits' })
    }
  ]);
};
