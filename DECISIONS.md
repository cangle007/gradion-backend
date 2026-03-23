# DECISIONS.md

This document explains the key choices made when building this project — what was picked, why, and what the trade-offs are.

---

## Stack Choices

### Node.js + Express

Express is a lightweight web framework for Node.js. It was chosen because it is minimal and flexible — it does not force a specific structure, which makes it fast to work with for a project of this scope.

A heavier framework like NestJS would have added more setup and ceremony than was necessary here.

### PostgreSQL

The data in this system has clear relationships: users own reports, and reports own expense items. A relational database is the natural fit for this kind of structure because it can enforce those relationships at the database level and prevent orphaned data.

PostgreSQL specifically was chosen because it supports returning inserted rows directly after an insert, which keeps the code clean without needing a separate query to fetch the newly created record.

### Knex.js (not a full ORM)

Knex is a query builder — it sits between raw SQL and a full ORM like Sequelize or TypeORM. It was chosen because:

- It gives full control over database queries without writing raw SQL strings
- It handles migrations, connection pooling, and parameterized queries out of the box
- A full ORM would have added more abstraction than value for a project this size

The trade-off is that joins and aggregations require more manual work than an ORM would provide. That is acceptable here.

### JWT for Authentication

When a user logs in, they receive a token (JWT) that they include in every subsequent request. The server verifies the token without needing to store session data anywhere.

This is simple to implement and works well for a stateless API. The trade-off is that tokens cannot be invalidated before they expire. In a production system, this would be addressed with short-lived tokens and a refresh token flow.

### Dependency Injection

Controllers and services receive their dependencies (like the database connection) passed in via the constructor, rather than importing them directly. This makes the code easier to test — in tests, a mock database can be passed in instead of a real one, without any hacking of the module system.

---

## Key Design Decisions

### Business Logic Lives in the Service Layer

All the rules about what is and is not allowed — which status transitions are valid, who owns which report, when items can be edited — live in the service layer, not in the controllers.

Controllers are intentionally thin. They receive the HTTP request, pass the relevant data to a service, and return the response. This separation means the business rules can be tested on their own without spinning up a web server.

### REJECTED Reports Can Be Re-submitted Directly

When an admin rejects a report, the user can fix their items and re-submit without the report going back to `DRAFT` first. The flow is:

1. Admin rejects the report
2. User edits or adds items
3. User submits again — directly from `REJECTED` to `SUBMITTED`

This was chosen because it is one fewer step for the user and feels more natural. The trade-off is that `REJECTED` behaves like `DRAFT` in terms of what the user can do, which could be surprising. This behaviour is intentional and documented here.

### Total Amount is Stored on the Report

The `total_amount` field on a report is updated every time an item is added, changed, or deleted — rather than being calculated fresh on every read by summing up the items.

This is a deliberate trade-off: reads are faster and simpler because the value is always ready. The downside is that if items were ever changed outside of the normal application flow, the total could drift out of sync. In practice this is prevented by routing all item changes through the service layer.

---

## Trade-offs and What I Would Do Differently

**No refresh tokens.** The JWTs issued at login are long-lived for simplicity. In production, tokens should be short-lived with a separate refresh token mechanism so that stolen tokens cannot be used indefinitely.

**No validation library.** Input validation is written manually in the service layer. A library like Zod or Joi would make validation more consistent, easier to read, and would produce better error messages with less code.

**Seeds are destructive.** Running the seed file wipes all existing data before inserting fresh records. A safer approach would use upserts so the seed can be run at any time without losing data. This was discovered the hard way during development.

---

## If I Had One More Day

I would build a basic frontend UI.

The API works end-to-end and the business logic is tested, but right now the only way to use the system is through a terminal with curl commands. That is not how real users interact with software.

A simple UI would make the product actually usable. The minimum I would build is four screens:

- A login page
- A list of expense reports
- A report detail page where items can be added, edited, and removed
- An admin view with approve and reject buttons

The reason I would prioritize this over other possible additions — like receipt uploads or an AI category suggestion feature — is that those features build on top of a workflow that currently has no interface. A frontend makes the whole system usable from end to end and would also surface any gaps in the API design: for example, whether the error messages are clear enough to show directly to a user, or whether the current filtering options are enough for an admin managing a large backlog.

For the implementation I would use React, keeping the structure simple: one context for authentication state, one custom hook per resource (`useReports`, `useReportItems`), and plain fetch calls to the existing API. Styling would not be the priority — something clean and functional is enough. The goal is a working demo, not a polished product.
