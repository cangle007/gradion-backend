# Expense Report Management System

A REST API for managing employee expense reports, built with Node.js, Express, and PostgreSQL.

---

## Tech Stack

- **Runtime:** Node.js 20
- **Framework:** Express
- **Database:** PostgreSQL 16 (via Knex.js)
- **Auth:** JWT (jsonwebtoken) + bcrypt
- **Testing:** Jest + Supertest
- **Containerization:** Docker + Docker Compose

---

## Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- Node.js 20+ (for running tests locally outside Docker)
- [`jq`](https://jqlang.github.io/jq/) for parsing JSON in the terminal examples below
  - macOS: `brew install jq`
  - Linux: `apt install jq`

---

## Running Locally

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <repo-name>
```

### 2. Start the application

```bash
docker compose down -v
docker compose up --build
```

This will:

- Spin up a PostgreSQL 16 database
- Run all pending migrations automatically
- Start the API server on **http://localhost:3000**

> The app container waits for the database health check to pass before starting.

### 3. Seed the database

```bash
docker compose exec app npx knex seed:run
```

This creates two seed accounts (password for both: `password123`):

| Email               | Role  |
| ------------------- | ----- |
| `admin@example.com` | admin |
| `test@example.com`  | user  |

---

## Running Tests

Tests run against a separate local test database (`expense_reports_test`). The Docker database container must be running before you do this.

### 1. Make sure the app is running

```bash
docker compose up -d
```

### 2. Create the test database

You only need to do this once:

```bash
docker compose exec db psql -U postgres -c "CREATE DATABASE expense_reports_test;"
```

### 3. Run migrations against the test database

```bash
NODE_ENV=test npx knex migrate:latest
```

### 4. Run the tests

```bash
npm install
npm test
```

---

## API Reference & curl Examples

This section walks through every endpoint in a logical flow, from signup to admin approval. Replace `REPORT_ID` and `ITEM_ID` with real IDs from previous responses.

---

### Step 1 — Auth

#### Sign up

```bash
curl -s -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "password123"}'
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Log in

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "password123"}'
```

#### Save your tokens as shell variables

Every protected endpoint requires an `Authorization: Bearer <token>` header. Instead of pasting the full token into every command, save it once as a shell variable and reuse it.

**Option A - copy it manually from the login response:**

Run the login command, find the `"token"` value in the response, then assign it like this (paste your own token between the quotes):

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoieW91QGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NzQxODMwMTQsImV4cCI6MTc3NDI2OTQxNH0.cXBBIloiCSV6oCRyLwvoX-yQCr3fVtMEtuX2AXu8xE8"
```

> Make sure you copy the **entire** token. It has three parts separated by dots. If any part is cut off you will get `Invalid or expired token`.

**Option B - let the shell extract it automatically (requires `jq`):**

> Seed accounts must exist first. Run `docker compose exec app npx knex seed:run`, or replace the emails below with the account you signed up with.

```bash
# Regular user token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}' | jq -r '.token')

# Admin token
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}' | jq -r '.token')
```

Either way, verify it is set correctly before continuing:

```bash
echo $TOKEN       # should print a long JWT, not null or blank
echo $ADMIN_TOKEN
```

> These variables only last for your current terminal session. If you open a new terminal window, run the assignment commands again.

---

### Step 2 — Expense Reports

#### Create a report

New reports are created in `DRAFT` status automatically.

```bash
curl -s -X POST http://localhost:3000/reports \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Q1 Travel", "description": "Conference flights and hotel"}'
```

**Response:**

```json
{
  "id": 1,
  "title": "Q1 Travel",
  "description": "Conference flights and hotel",
  "status": "DRAFT",
  "total_amount": 0,
  "user_id": 2
}
```

Save the report ID from the `"id"` field in the response above. Replace `1` with whatever ID was returned:

```bash
REPORT_ID=1   # replace with the actual id from the response
```

Verify it's set:

```bash
echo $REPORT_ID   # should print a number, not blank
```

#### List your own reports

```bash
curl -s http://localhost:3000/reports \
  -H "Authorization: Bearer $TOKEN"
```

#### Filter by status

```bash
curl -s "http://localhost:3000/reports?status=DRAFT" \
  -H "Authorization: Bearer $TOKEN"
```

#### Get a single report

```bash
curl -s http://localhost:3000/reports/$REPORT_ID \
  -H "Authorization: Bearer $TOKEN"
```

#### Update a report (DRAFT only)

```bash
curl -s -X PATCH http://localhost:3000/reports/$REPORT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Q1 Travel — Updated", "description": "Flights, hotel, and meals"}'
```

#### Delete a report (DRAFT only)

```bash
curl -s -X DELETE http://localhost:3000/reports/$REPORT_ID \
  -H "Authorization: Bearer $TOKEN"
```

> Create a fresh report before continuing if you deleted it.

---

### Step 3 — Expense Items

Items can only be added, updated, or deleted while the parent report is in `DRAFT`.

#### Add an item

```bash
curl -s -X POST http://localhost:3000/reports/$REPORT_ID/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 250.00,
    "currency": "USD",
    "category": "Travel",
    "merchant_name": "Delta Airlines",
    "transaction_date": "2026-03-10"
  }'
```

**Response:**

```json
{
  "id": 1,
  "report_id": 1,
  "amount": "250.00",
  "currency": "USD",
  "category": "Travel",
  "merchant_name": "Delta Airlines",
  "transaction_date": "2026-03-10"
}
```

Save the item ID from the `"id"` field in the response above:

```bash
ITEM_ID=1   # replace with the actual id from the response
```

Verify:

```bash
echo $ITEM_ID
```

Add a second item so `total_amount` is meaningful:

```bash
curl -s -X POST http://localhost:3000/reports/$REPORT_ID/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 175.50,
    "currency": "USD",
    "category": "Lodging",
    "merchant_name": "Hilton",
    "transaction_date": "2026-03-11"
  }'
```

#### List all items on a report

```bash
curl -s http://localhost:3000/reports/$REPORT_ID/items \
  -H "Authorization: Bearer $TOKEN"
```

#### Update an item (DRAFT only)

```bash
curl -s -X PATCH http://localhost:3000/reports/$REPORT_ID/items/$ITEM_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 300.00, "merchant_name": "United Airlines"}'
```

#### Delete an item (DRAFT only)

```bash
curl -s -X DELETE http://localhost:3000/reports/$REPORT_ID/items/$ITEM_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

### Step 4 — Submit the report

Transitions the report from `DRAFT` → `SUBMITTED`. The report is now locked — item edits are no longer allowed.

```bash
curl -s -X POST http://localhost:3000/reports/$REPORT_ID/submit \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**

```json
{
  "id": 1,
  "status": "SUBMITTED",
  "total_amount": "475.50"
}
```

#### Verify items are now locked

This should return a `403` or `400` error:

```bash
curl -s -X POST http://localhost:3000/reports/$REPORT_ID/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50.00, "currency": "USD", "category": "Meals", "merchant_name": "Starbucks", "transaction_date": "2026-03-12"}'
```

---

### Step 5 — Admin: Approve or Reject

#### List all submitted reports

```bash
curl -s "http://localhost:3000/admin/reports?status=SUBMITTED" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Approve a report

Transitions `SUBMITTED` → `APPROVED` (terminal state).

```bash
curl -s -X POST http://localhost:3000/admin/reports/$REPORT_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response:**

```json
{
  "id": 1,
  "status": "APPROVED"
}
```

#### Reject a report instead

Transitions `SUBMITTED` → `REJECTED`. The user can then re-edit and re-submit.

```bash
curl -s -X POST http://localhost:3000/admin/reports/$REPORT_ID/reject \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### Step 6 — Re-submit after rejection

After rejection the report returns to `DRAFT`. The user can edit items again and re-submit.

```bash
# Add or edit items again
curl -s -X POST http://localhost:3000/reports/$REPORT_ID/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 45.00,
    "currency": "USD",
    "category": "Meals",
    "merchant_name": "Chipotle",
    "transaction_date": "2026-03-13"
  }'

# Re-submit
curl -s -X POST http://localhost:3000/reports/$REPORT_ID/submit \
  -H "Authorization: Bearer $TOKEN"
```

---

### Step 7 — List all reports (admin view)

```bash
# All reports across all users
curl -s http://localhost:3000/admin/reports \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Filter by any status
curl -s "http://localhost:3000/admin/reports?status=APPROVED" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Status State Machine

```
  DRAFT  ──[Submit]──►  SUBMITTED  ──[Approve]──►  APPROVED
    ▲                       │                         (final)
    │                       │ [Reject]
    └───────────────────────┘
                        REJECTED
```

- Users may add/edit/delete items only in `DRAFT`.
- After rejection, the report reverts to `DRAFT` so it can be corrected and re-submitted.
- `APPROVED` is a terminal state — no further transitions are possible.
- Transition validation is enforced at the **service layer**, not in controllers.

---

## Architecture Overview

```
.
├── routes/           # Express routers — HTTP wiring only
├── instances/        # Controller instances (dependency injection)
├── controllers/      # Request/response handling, no business logic
├── services/         # Business logic, state machine, ownership checks
├── repositories/     # Database queries via Knex
├── middlewares/      # authenticate, requireRole
├── migrations/       # Knex schema migrations
├── seeds/            # Development seed data
├── tests/            # Unit and integration tests
├── knexfile.js
├── knex.js
├── server.js
└── docker-compose.yml
```

Controllers stay thin — they parse inputs and delegate to services. All business rules (state transitions, ownership checks, edit locks) live in the service layer.

---

## AI Usage

This project was developed with assistance from **Claude (Anthropic)** and **GitHub Copilot**.

**How AI helped:**

- Scaffolded the initial project structure, Knex migrations, and Docker Compose configuration.
- Generated boilerplate for middleware (`authenticate`, `requireRole`) and controller patterns.
- Suggested the dependency-injection pattern used for routing (passing controller instances into route factories).

**Where I overrode or corrected the output:**

- The initial state machine implementation Claude suggested handled transitions as a flat `switch` statement in the controller. I moved this into a dedicated service layer with an explicit transition map, which is more testable and closer to what the spec required.
- Copilot's first suggestion for `total_amount` used a raw SQL string rather than Knex's query builder — I rewrote it to stay consistent with the rest of the data layer.
- Seed data relationships had a subtle bug where the admin user's report was seeded before the user IDs were confirmed from the `returning()` call. I corrected the ordering and destructuring logic.
