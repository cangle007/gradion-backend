# CLAUDE.md

This file provides project context for Claude when assisting with this codebase.

---

## Project Overview

A REST API for an Expense Report Management System built as a take-home assessment. The system allows users to create and submit expense reports with line items, and admins to approve or reject them.

No frontend is required — this is a JSON REST API only.

---

## Stack

- **Runtime:** Node.js 20
- **Framework:** Express (minimal, no heavy framework)
- **Database:** PostgreSQL 16
- **Query builder:** Knex.js (no ORM)
- **Auth:** JWT (jsonwebtoken) + bcrypt
- **Testing:** Jest + Supertest
- **Container:** Docker + Docker Compose

---

## Project Structure

```
.
├── routes/           # Express routers — HTTP wiring only, no logic
├── instances/        # Instantiates controllers and services (DI wiring)
├── controllers/      # Parses request, calls service, sends response
├── services/         # All business logic lives here
├── middlewares/
│   ├── authenticate.js   # Verifies JWT, attaches user to req
│   └── requireRole.js    # RBAC — checks req.user.role
├── migrations/       # Knex migrations
├── seeds/            # Dev seed data
├── tests/
│   ├── unit/         # State machine and service logic tests
│   └── integration/  # Full happy-path tests via supertest
├── errors/
│   └── AppError.js   # Custom error classes (BadRequestError, NotFoundError, etc.)
├── knex.js           # Knex instance
├── knexfile.js       # Knex config for development and test environments
├── server.js         # Express app setup and route registration
└── env.js            # Loads dotenv based on NODE_ENV
```

---

## Architecture Conventions

### Controllers are thin

Controllers only handle HTTP concerns: parsing `req.body`, `req.params`, `req.user`, calling the appropriate service method, and returning the response. No business logic in controllers.

```js
// Good
async createReport(req, res, next) {
  try {
    const report = await this._reportService.createReport(req.user.id, req.body);
    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
}

// Bad — business logic in controller
async createReport(req, res, next) {
  if (req.user.role !== 'user') { ... }   // belongs in service or middleware
  if (!req.body.title) { ... }            // belongs in service
}
```

### Services own all business logic

State machine transitions, ownership checks, edit locks, and validation all live in the service layer. This makes them unit-testable without HTTP.

### Dependency injection

Services and controllers are instantiated in `instances/` and injected into route factories. This makes testing easy — pass a mock knex instance, no monkey-patching needed.

```js
// instances/reportsController.js
const ReportService = require('../services/ReportService');
const ReportsController = require('../controllers/ReportsController');
const knex = require('../knex');

const reportService = new ReportService(
  { reportTable: 'expense_reports' },
  knex,
);
const reportsController = new ReportsController({ reportService });

module.exports = reportsController;
```

### Error handling

Use custom error classes from `errors/AppError.js`. Throw them from services. The global error handler in `server.js` catches them and sends the appropriate HTTP response.

```js
throw new BadRequestError('Only DRAFT reports can be submitted');
throw new NotFoundError('Report not found');
```

Never return error responses directly from services — always throw.

---

## Domain Model

### Users

| Field         | Type    | Notes             |
| ------------- | ------- | ----------------- |
| id            | serial  | PK                |
| email         | varchar | unique            |
| password_hash | varchar | bcrypt            |
| role          | varchar | 'user' or 'admin' |

### Expense Reports

| Field        | Type      | Notes                     |
| ------------ | --------- | ------------------------- |
| id           | serial    | PK                        |
| user_id      | integer   | FK -> users               |
| title        | varchar   | required                  |
| description  | text      | optional                  |
| status       | varchar   | see state machine below   |
| total_amount | decimal   | denormalized sum of items |
| created_at   | timestamp |                           |
| updated_at   | timestamp |                           |

### Expense Items

| Field            | Type    | Notes                                 |
| ---------------- | ------- | ------------------------------------- |
| id               | serial  | PK                                    |
| report_id        | integer | FK -> expense_reports, CASCADE DELETE |
| amount           | decimal |                                       |
| currency         | varchar | e.g. 'USD'                            |
| category         | varchar | e.g. 'Travel', 'Meals'                |
| merchant_name    | varchar |                                       |
| transaction_date | date    |                                       |

---

## State Machine

```
DRAFT -> SUBMITTED -> APPROVED (terminal)
DRAFT -> SUBMITTED -> REJECTED -> SUBMITTED (directly, no DRAFT step needed)
```

Key rules enforced in `ReportService`:

- Items can only be added/edited/deleted when report is in `DRAFT` or `REJECTED`
- Only `DRAFT` or `REJECTED` reports can be submitted
- Only `SUBMITTED` reports can be approved or rejected
- Only `DRAFT` reports can be deleted
- `APPROVED` is a terminal state — no further transitions

---

## Auth

- `POST /auth/signup` and `POST /auth/login` are public
- All other routes require `Authorization: Bearer <token>`
- The `authenticate` middleware verifies the JWT and attaches `req.user = { id, email, role }`
- The `requireRole('admin')` middleware guards all `/admin/*` routes

---

## Environment Variables

| Variable            | Used in                                 |
| ------------------- | --------------------------------------- |
| `DATABASE_URL`      | development knex connection             |
| `TEST_DATABASE_URL` | test knex connection                    |
| `JWT_KEY`           | signing and verifying JWTs              |
| `PORT`              | Express listen port (default 3000)      |
| `NODE_ENV`          | switches knex config and morgan logging |

---

## Running Locally

```bash
docker compose up --build
docker compose exec app npx knex seed:run
```

## Running Tests

```bash
npm install
NODE_ENV=test npx knex migrate:latest
npm test
```

---

## What I Asked Claude to Help With

- Scaffolding the initial project structure and Docker Compose setup
- Generating boilerplate for middleware (`authenticate`, `requireRole`)
- Drafting the dependency injection wiring in `instances/`
- Writing `README.md` and `DECISIONS.md`
- Debugging the seed file (`TRUNCATE` vs `del()` foreign key issue)
- Explaining why `returning()` was returning unexpected results during seeding

## Where I Overrode Claude's Output

- Moved state machine logic out of controllers into the service layer — Claude's first suggestion put transition checks in the controller
- Rewrote `total_amount` update logic to use Knex query builder consistently instead of a raw SQL string Claude suggested
- Adjusted the seed file to use `knex.raw('TRUNCATE ... CASCADE')` after Claude helped diagnose why `del()` was silently failing due to foreign key constraints
