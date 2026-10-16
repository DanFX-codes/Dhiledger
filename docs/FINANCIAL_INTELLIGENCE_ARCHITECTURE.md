# Financial Intelligence Dashboard Architecture

## Existing Baseline

- Frontend: React 18, JavaScript, Vite, and React Router.
- Identity: Supabase Auth with Google OAuth and browser-persisted Supabase sessions.
- Data: Supabase Postgres accessed through the Supabase client.
- Current authorization: `ledger_entries` has row-level security policies scoped to `auth.uid()`; the workspace supports manual expense records and realtime inserts.
- Current limits: There is no separate API service, organization membership model, CSV import pipeline, analysis engine, findings workflow, savings verification, or production report export. The homepage/demo is sample content and is not customer data.

## Architecture Decision

Retain Supabase as the managed identity and database platform. It already provides the backend boundary used by this application; adding a parallel Express/Prisma service would duplicate authentication and persistence without improving the current MVP. Use versioned SQL migrations for schema and RLS changes. Use authenticated Supabase Edge Functions for CSV validation/import and analysis so parsing, authorization, and business rules do not run only in the browser. Edge Functions must validate the caller JWT and derive user/organisation identity from that verified session; never trust a user ID supplied in a request body.

The browser may use the public anon key and session token only. A service-role key, if a narrowly scoped server operation eventually needs one, belongs only in managed server secrets and must never be exposed through a `VITE_` variable. Database RLS remains enabled as defense in depth.

## Data and Security Boundaries

- Add organisations and membership roles before allowing shared company data. Enforce membership checks in database policies and every server operation.
- Preserve imported source values separately from normalized values. Store monetary values as PostgreSQL `NUMERIC` and keep currency totals separate unless a documented exchange-rate source is implemented.
- Link imported transactions to an import record; link analysis runs and versioned findings to source transactions; link savings claims and explicit verification decisions to findings and evidence.
- Process CSV files in authenticated server functions. Prefer in-memory processing and discard raw files unless retention is explicitly required and documented.
- Use deterministic rules, persisted rule versions, and auditable outputs. Findings are candidates, not proof of loss or savings.
- Keep profile display fields in the authenticated user's Supabase Auth metadata. Metadata is for display only and must never determine roles or authorization.

## Staged Implementation Plan

1. Repository and backend audit, architecture decision, and environment boundaries. Completed in this document.
2. Extend the schema with organisations, membership/roles, imports, immutable transaction source fields, audit events, and required RLS policies; add migrations and isolation tests.
3. Implement authenticated CSV validation, preview contracts, import processing, idempotency, and import history in server-side functions.
4. Implement deterministic, versioned analysis rules and evidence-linked findings with review history.
5. Implement dashboard analytics from persisted transactions, with documented periods, currency separation, loading/error/retry/empty states.
6. Implement savings claims and explicit verification, then reports/CSV export with formula-injection protection.
7. Complete responsive dashboard navigation, profile/settings, accessibility, security review, end-to-end tests, and deployment verification.

## Current Delivery Boundary

The existing live workspace is a user-scoped manual ledger, not the full financial-intelligence product described in the product brief. CSV ingestion, organisation sharing, findings, savings verification, and reports remain unimplemented until their schema, server-side processing, tests, and deployment are in place. Do not describe them as available before those checks pass.
