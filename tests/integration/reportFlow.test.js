const request = require('supertest');
const app = require('../../app');
const { knex, resetDatabase } = require('./setupTestDb');
const createAdminUser = require('./helpers/createAdminUser');

describe('Expense report submit/approve flow', () => {
  beforeAll(async () => {
    await knex.migrate.latest();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await knex.destroy();
  });

  it('allows a user to create a report, add an item, submit it, and allows an admin to approve it', async () => {
    // 1. User signup
    const signupResponse = await request(app).post('/auth/signup').send({
      email: 'user@example.com',
      password: 'UserPass123!',
    });

    expect(signupResponse.status).toBe(201);

    // 2. User login
    const loginResponse = await request(app).post('/auth/login').send({
      email: 'user@example.com',
      password: 'UserPass123!',
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.token).toBeDefined();

    const userToken = loginResponse.body.token;

    // 3. Create report
    const createReportResponse = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'March travel expenses',
        description: 'Client meeting in SF',
      });

    expect(createReportResponse.status).toBe(201);
    expect(createReportResponse.body.id).toBeDefined();
    expect(createReportResponse.body.status).toBe('DRAFT');

    const reportId = createReportResponse.body.id;

    // 4. Add expense item
    const createItemResponse = await request(app)
      .post(`/reports/${reportId}/items`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        amount: 125.5,
        currency: 'USD',
        category: 'Meals',
        merchant_name: 'Chipotle',
        transaction_date: '2026-03-20',
      });

    expect(createItemResponse.status).toBe(201);
    expect(createItemResponse.body.id).toBeDefined();

    // 5. Verify report total_amount updated
    const reportAfterItemResponse = await request(app)
      .get(`/reports/${reportId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(reportAfterItemResponse.status).toBe(200);
    expect(Number(reportAfterItemResponse.body.total_amount)).toBe(125.5);
    expect(reportAfterItemResponse.body.status).toBe('DRAFT');

    // 6. Submit report
    const submitResponse = await request(app)
      .post(`/reports/${reportId}/submit`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(submitResponse.status).toBe(200);
    expect(submitResponse.body.status).toBe('SUBMITTED');

    // 7. Create admin directly in DB
    const { password: adminPassword } = await createAdminUser(knex, {
      email: 'admin@example.com',
      password: 'AdminPass123!',
    });

    // 8. Admin login
    const adminLoginResponse = await request(app).post('/auth/login').send({
      email: 'admin@example.com',
      password: adminPassword,
    });

    expect(adminLoginResponse.status).toBe(200);
    expect(adminLoginResponse.body.token).toBeDefined();

    const adminToken = adminLoginResponse.body.token;

    // 9. Admin approve submitted report
    const approveResponse = await request(app)
      .post(`/admin/reports/${reportId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(approveResponse.status).toBe(200);
    expect(approveResponse.body.status).toBe('APPROVED');

    // 10. Confirm final status in DB/API
    const finalReportResponse = await request(app)
      .get(`/reports/${reportId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(finalReportResponse.status).toBe(200);
    expect(finalReportResponse.body.status).toBe('APPROVED');
    expect(Number(finalReportResponse.body.total_amount)).toBe(125.5);
  });
});
