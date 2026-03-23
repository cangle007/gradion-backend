exports.up = function (knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id');
    table.string('email').notNullable().unique();
    table.specificType('password_hash', 'char(60)').notNullable();
    table.string('role').notNullable().defaultTo('user');

    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('users');
};
