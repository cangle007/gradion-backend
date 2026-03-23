exports.up = function (knex) {
  return knex.schema.createTable('expense_reports', (table) => {
    table.increments('id');
    table.string('title').notNullable();
    table.string('description');
    table.string('status').notNullable().defaultTo('DRAFT');
    table.decimal('total_amount', 12, 2).notNullable().defaultTo(0);
    table
      .integer('user_id')
      .references('id')
      .inTable('users')
      .onDelete('cascade')
      .index();

    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('expense_reports');
};
