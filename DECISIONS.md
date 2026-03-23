# DECISIONS.md

## Stack Choices

### Node.js + Express

Express is minimal by design — it gets out of the way and lets you structure the application how you want. For a scoped exercise like this, a lightweight framework is the right call. A heavier framework like NestJS would have been over-engineering for the scope given.

### PostgreSQL

The domain has clear relational structure: users own reports, reports own items, and foreign key constraints enforce that at the database level. A relational database is the natural fit here. PostgreSQL specifically because it has first-class support for `RETURNING`, which makes insert-then-use patterns clean without a separate fetch round trip.

### Knex.js over an ORM

I chose Knex as a query builder rather than reaching for an ORM like Sequelize or TypeORM. For a project of this scope, an ORM adds more abstraction than value — you end up fighting it on anything non-trivial. Knex gives you full control over queries while still handling parameterization, connection pooling, and migrations. The tradeoff is more manual work on joins and aggregates, but that is acceptable here.

### JWT for auth

Stateless, simple to implement, and no session storage needed. The tradeoff is that tokens cannot be revoked before expiry without additional infrastructure (a token blacklist or short expiry + refresh tokens). For this exercise that tradeoff is acceptable. In a production system I would add refresh tokens and a short access token TTL.

### Dependency injection for controllers and services

Controllers receive their dependencies (services, knex) via constructor injection rather than importing them directly. This makes unit testing straightforward — you can pass in a mock knex instance without monkey-patching modules. It also makes the wiring explicit and easy to follow in `instances/`.

---

## Key Design Decisions

### Business logic lives in the service layer

All state machine validation, ownership checks, and edit locks are enforced in `ReportService`, not in controllers. Controllers only parse the request and hand off to the service. This means the business rules are testable in isolation without spinning up an HTTP server.

### REJECTED -> SUBMITTED directly (skipping DRAFT)

When a report is rejected, the user can correct their items and re-submit without the report needing to transition back through `DRAFT` explicitly. The `_assertSubmittable` and `_assertEditable` methods both allow `REJECTED` as a valid starting state, so the workflow is: admin rejects, user edits items, user hits submit. This is one fewer round trip and feels more natural from a user perspective. The tradeoff is that `REJECTED` is a somewhat ambiguous state — it acts like `DRAFT` in terms of editability. This is documented so it does not surprise future developers.

### total_amount is stored, not purely computed

`total_amount` on the report is updated whenever items are added, updated, or deleted rather than being computed on every read via a subquery or join. This is a deliberate denormalization — reads are cheaper and the value is always available without aggregation. The tradeoff is that the column can theoretically drift out of sync if items are manipulated outside the service layer. In practice this is mitigated by routing all mutations through the service.

---

## Trade-offs and What I Would Do Differently

- **No refresh tokens.** JWTs are long-lived for simplicity. In production I would add short-lived access tokens with a refresh token flow.
- **No request validation library.** Input validation is done manually in the service layer. A library like Zod or Joi would make this more consistent and give better error messages with less code.
- **Seeds are not idempotent.** The seed file uses `TRUNCATE` to clear data before inserting, which is destructive. A safer approach would be upserts so the seed can be run repeatedly in any state without wiping existing data.

---

## If You Had One More Day

I would build a basic frontend UI.

The API is complete and the business logic is well-tested, but there is no way for a non-technical person to actually use this system right now. A simple UI would make the product real rather than just a collection of endpoints.

The minimum useful surface would be four screens: a login page, an expense report list, a report detail page where items can be added and edited, and a submit button. For the admin side, a list of submitted reports with approve and reject actions would close the loop.

The reason I would prioritize this over the other optional enhancements is that it delivers the most tangible value relative to effort. Receipt uploads and AI category suggestions are useful features, but they build on top of a workflow that currently has no interface. A frontend makes the entire system usable end-to-end and would surface any UX assumptions baked into the API design — for example, whether the current error messages are clear enough to display directly to a user, or whether the status filter on the reports list is sufficient for the admin to triage a backlog of submissions.

Practically, I would use React with a minimal component structure: a context for auth state, a custom hook per resource (useReports, useReportItems), and straightforward fetch calls to the existing API. Styling would be secondary — clean and functional matters more than polished for a one-day build. The goal would be a working demo, not a finished product.
