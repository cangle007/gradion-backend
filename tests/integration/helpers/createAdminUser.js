const bcrypt = require('bcrypt');

async function createAdminUser(knex, overrides = {}) {
  const password = overrides.password || 'AdminPass123!';
  const passwordHash = await bcrypt.hash(password, 10);

  const [admin] = await knex('users').insert(
    {
      email: overrides.email || 'admin@example.com',
      password_hash: passwordHash,
      role: 'admin',
    },
    '*',
  );

  return {
    admin,
    password,
  };
}

module.exports = createAdminUser;
