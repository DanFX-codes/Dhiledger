# Dhiledger Architecture and Implementation Notes

## Current status
This repository was originally a frontend-only marketing site and demo dashboard. To move it toward the implementation prompt, the project now includes a real backend API foundation with:

- Express-based application routes
- JWT-based authentication middleware
- organization-aware access control
- CSV validation and upload processing
- transaction ledger and dashboard summary APIs
- seeded, organization-scoped data primitives
- a Postgres-ready SQL schema for the required product entities

This is the required architecture foundation for the full financial-intelligence product described in the implementation brief, but it is not a complete production product yet. The missing work is the full deployment of a real database, migration management, end-to-end import processing, deterministic analysis rules, savings verification workflow, and automated integration tests against a database-backed environment.

## Principles applied
- Real product boundary, not a mockup: routes are backed by server-side logic and not browser-only state.
- Evidence-first calculations: summary endpoints operate from stored transactions instead of hardcoded numbers.
- Organisation-level isolation: API routes enforce membership checks before data is returned.
- No fabricated customer data: empty state APIs remain empty until actual data exists.
- Safe defaults: when database credentials are absent, local development runs in memory rather than pretending a real database is present.

## Default architecture chosen
- Frontend: React + Vite (existing project)
- Backend: Node.js + Express
- Database: PostgreSQL-ready schema in `server/schema.sql`
- Authentication: JWT-based server auth with organisation membership checks
- CSV processing: server-side parsing and validation before import

## Files added for the foundation
- `server/index.js` — Express API surface and request validation
- `server/schema.sql` — database schema for users, organizations, imports, transactions, findings, savings, and audit events

## Required next steps for full prompt compliance
1. Add a real Postgres service and connection string.
2. Replace the in-memory data store with a Prisma or raw SQL repository layer.
3. Add import job retries, dedupe tracking, and row-level validation reporting.
4. Implement deterministic analysis rules for duplicates, recurring spend, vendor concentration, and savings opportunities.
5. Add findings review, status history, savings verification, and audit event persistence.
6. Add dashboard totals that exactly match database values and export flows with sanitization.
7. Run end-to-end integration tests with real seeded data and isolated organisations.

## Environment variables
The backend expects the following values in a real deployment environment:

- `PORT` — HTTP port for the API
- `JWT_SECRET` — secret used to sign access tokens
- `DATABASE_URL` — PostgreSQL connection string when the system is connected to the real database
- `MAX_UPLOAD_BYTES` — maximum CSV upload size in bytes

## Security reminders
- Never commit real credentials.
- Keep secrets in environment variables only.
- All sensitive operations must remain server-side and authorisation-checked.
- Do not claim compliance or certification without independent evidence.
