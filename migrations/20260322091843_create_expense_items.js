exports.up = function (knex) {
  return knex.schema.createTable('expense_items', (table) => {
    table.increments('id');
    table.decimal('amount', 12, 2).notNullable();
    table.string('currency', 3).notNullable();
    table.string('category').notNullable();
    table.string('merchant_name').notNullable();
    table.date('transaction_date').notNullable();
    table
      .integer('report_id')
      .references('id')
      .inTable('expense_reports')
      .onDelete('cascade')
      .index();

    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('expense_items');
};
