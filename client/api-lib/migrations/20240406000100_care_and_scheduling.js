/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema
    .createTable('support_workers', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
      table.string('name').notNullable();
      table.string('email').unique().notNullable();
      table.string('phone');
      table.jsonb('skills'); // e.g. ["Dementia Care", "Manual Handling", "CPR"]
      table.string('base_region'); // e.g. "Hobart"
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('care_plans', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('client_id').references('id').inTable('clients').onDelete('CASCADE');
      table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
      table.jsonb('goals'); // e.g. [{"goal": "Stay at home", "priority": "High"}]
      table.jsonb('services'); // e.g. [{"type": "Personal Care", "hours": 3, "rate": 65, "frequency": "weekly"}]
      table.decimal('monthly_budget', 12, 2);
      table.string('status').defaultTo('active');
      table.timestamps(true, true);
    })
    .createTable('schedules', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
      table.uuid('care_plan_id').references('id').inTable('care_plans').onDelete('SET NULL');
      table.uuid('client_id').references('id').inTable('clients').onDelete('CASCADE');
      table.uuid('worker_id').references('id').inTable('support_workers').onDelete('SET NULL');
      table.string('service_type'); 
      table.dateTime('start_time').notNullable();
      table.dateTime('end_time').notNullable();
      table.text('notes');
      table.enum('status', ['planned', 'completed', 'cancelled', 'missed']).defaultTo('planned');
      table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema
    .dropTableIfExists('schedules')
    .dropTableIfExists('care_plans')
    .dropTableIfExists('support_workers');
};
