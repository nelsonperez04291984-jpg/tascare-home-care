/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
  const defaultTenantId = '00000000-0000-0000-0000-000000000000';

  // Deletes ALL existing entries
  await knex('support_workers').del();

  await knex('support_workers').insert([
    {
      tenant_id: defaultTenantId,
      name: 'Sarah Jenkins',
      email: 'sarah.j@tascare.com.au',
      phone: '0412 123 456',
      skills: JSON.stringify(['Dementia Care', 'Manual Handling', 'CPR']),
      base_region: 'Hobart',
      is_active: true
    },
    {
      tenant_id: defaultTenantId,
      name: 'Mark Thompson',
      email: 'mark.t@tascare.com.au',
      phone: '0413 987 654',
      skills: JSON.stringify(['Cleaning', 'Transport', 'Social Support']),
      base_region: 'Kingston',
      is_active: true
    },
    {
      tenant_id: defaultTenantId,
      name: 'Elena Garcia',
      email: 'elena.g@tascare.com.au',
      phone: '0414 555 777',
      skills: JSON.stringify(['Personal Care', 'Medication Management']),
      base_region: 'Clarence',
      is_active: true
    }
  ]);
};
