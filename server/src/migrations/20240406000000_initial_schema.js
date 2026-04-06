/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema
    .createTable('tenants', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.string('subdomain').unique().notNullable();
      table.timestamps(true, true);
    })
    .createTable('users', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
      table.string('email').unique().notNullable();
      table.string('password_hash').notNullable();
      table.string('name').notNullable();
      table.enum('role', ['admin', 'coordinator', 'caregiver']).defaultTo('coordinator');
      table.timestamps(true, true);
    })
    .createTable('referrals', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
      table.string('client_name').notNullable();
      table.date('dob');
      table.enum('funding_type', ['HCP', 'CHSP', 'NDIS', 'Private', 'Unknown']).defaultTo('Unknown');
      table.integer('hcp_level');
      table.string('my_aged_care_id');
      table.enum('status', ['new', 'contacted', 'assessment_scheduled', 'accepted', 'declined']).defaultTo('new');
      table.string('referral_source');
      table.text('summary');
      table.jsonb('raw_data');
      table.timestamps(true, true);
    })
    .createTable('clients', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
      table.string('name').notNullable();
      table.date('dob');
      table.string('address');
      table.string('suburb');
      table.string('postcode');
      table.string('my_aged_care_id');
      table.jsonb('funding_details');
      table.string('status').defaultTo('active');
      table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema
    .dropTableIfExists('clients')
    .dropTableIfExists('referrals')
    .dropTableIfExists('users')
    .dropTableIfExists('tenants');
};
