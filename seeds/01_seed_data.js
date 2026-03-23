const bcrypt = require('bcrypt');

exports.seed = async function (knex) {
  await knex.raw(
    'TRUNCATE expense_items, expense_reports, users RESTART IDENTITY CASCADE',
  );

  const passwordHash = await bcrypt.hash('password123', 10);

  const insertedUsers = await knex('users')
    .insert([
      {
        email: 'admin@example.com',
        password_hash: passwordHash,
        role: 'admin',
      },
      {
        email: 'test@example.com',
        password_hash: passwordHash,
        role: 'user',
      },
    ])
    .returning(['id', 'email', 'role']);

  const adminUser = insertedUsers.find((u) => u.email === 'admin@example.com');
  const normalUser = insertedUsers.find((u) => u.email === 'test@example.com');

  const insertedReports = await knex('expense_reports')
    .insert([
      {
        title: 'March Team Travel',
        description: 'Flight and hotel expenses for conference travel',
        status: 'DRAFT',
        total_amount: 425.5,
        user_id: normalUser.id,
      },
      {
        title: 'Client Dinner',
        description: 'Dinner meeting with client',
        status: 'SUBMITTED',
        total_amount: 138.2,
        user_id: normalUser.id,
      },
      {
        title: 'Admin Audit Review',
        description: 'Internal admin review sample report',
        status: 'APPROVED',
        total_amount: 89.99,
        user_id: adminUser.id,
      },
    ])
    .returning(['id', 'title', 'user_id']);

  const marchTravel = insertedReports.find(
    (r) => r.title === 'March Team Travel',
  );
  const clientDinner = insertedReports.find((r) => r.title === 'Client Dinner');
  const adminAudit = insertedReports.find(
    (r) => r.title === 'Admin Audit Review',
  );

  await knex('expense_items').insert([
    {
      amount: 250.0,
      currency: 'USD',
      category: 'Travel',
      merchant_name: 'Delta Airlines',
      transaction_date: '2026-03-10',
      report_id: marchTravel.id,
    },
    {
      amount: 175.5,
      currency: 'USD',
      category: 'Lodging',
      merchant_name: 'Hilton',
      transaction_date: '2026-03-11',
      report_id: marchTravel.id,
    },
    {
      amount: 138.2,
      currency: 'USD',
      category: 'Meals',
      merchant_name: 'Steak House',
      transaction_date: '2026-03-12',
      report_id: clientDinner.id,
    },
    {
      amount: 89.99,
      currency: 'USD',
      category: 'Office',
      merchant_name: 'Staples',
      transaction_date: '2026-03-09',
      report_id: adminAudit.id,
    },
  ]);
};
