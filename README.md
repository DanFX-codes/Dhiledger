# Dhiledger

Dhiledger is an early-stage financial-intelligence product for technology-driven teams. This repository contains a React website, a fictional read-only product demo, a Supabase-backed private expense workspace, and a separate Express API prototype.

> The workspace stores expenses entered by the signed-in user or imported from CSV. It does not connect to bank accounts, accounting systems, cloud providers, or vendor accounts. It is not financial advice.

## What Works Today

- Marketing pages, product information, FAQs, and early-access/contact forms.
- A read-only demo using fictional sample data at `/demo`.
- Private account creation and sign-in using email/password, Google, or GitHub through Supabase Auth.
- A workspace at `/dashboard` for manually recording and deleting expenses.
- CSV import with validation and a preview before saving to the signed-in user's Supabase ledger.
- Currency-specific monthly summaries and a six-month activity chart. The summary defaults to the newest month with data; after import it selects the newest month in the imported file. The month selector can be changed manually.
- Supabase Realtime updates for newly inserted ledger entries.

The public site and read-only demo can run without Supabase. Sign-up, sign-in, and the persistent workspace require a configured Supabase project. Forms require a configured form endpoint before they can submit.

## Technology

- React 18 and Vite 6
- React Router for client-side routes
- Supabase Auth, Postgres, and Realtime for the private workspace
- `csv-parse` for CSV parsing in the browser and API prototype
- Express, JWT, bcrypt, and Multer in a separate API foundation
- Vitest, Testing Library, and ESLint for automated checks

## Requirements

- Node.js 18 or newer
- npm
- A Supabase project for account authentication and persistent workspace data

## Local Setup

```bash
git clone https://github.com/DanFX-codes/Dhiledger.git
cd Dhiledger
npm ci
```

Create a `.env.local` file in the project root. Vite reads this file automatically:

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_SITE_URL=
VITE_FORM_ENDPOINT=
```

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` enable authentication and the private workspace. `VITE_SITE_URL` is optional and should be set to the deployed HTTPS origin; leave it blank for local development. It is used for canonical metadata and generated SEO files. `VITE_FORM_ENDPOINT` is optional; without it, contact and early-access forms remain visibly unavailable.

Start the frontend:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The sign-up page is `/signup`, sign-in is `/login`, and the protected workspace is `/dashboard`.

## Supabase Configuration

1. Create a Supabase project and copy its Project URL and public anon key from Project Settings → API.
2. Add the two `VITE_SUPABASE_*` values to `.env.local` and restart Vite.
3. In Supabase Authentication → Providers, enable Email (password), Google, and GitHub as desired. Add provider credentials in Supabase; do not put OAuth client secrets in this repository or in `VITE_` variables.
4. In Authentication → URL Configuration, allow the local and deployed callback URLs, for example `http://localhost:3000/auth/callback` and `https://your-domain.example/auth/callback`.
5. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor. It creates `public.ledger_entries`, enables row-level security (RLS), and configures the policies and Realtime publication used by the workspace.
6. Test sign-up confirmation, email/password sign-in, configured OAuth providers, sign-out, and row isolation in a non-production project before launch.

The browser uses only the public anon key. Never expose a Supabase service-role key. Keep `JWT_SECRET`, database passwords, OAuth client secrets, and other private credentials in local ignored files or the hosting provider's secret store. Never commit real credentials.

See [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) for provider and SQL setup details.

## CSV Import

The dashboard accepts `.csv` files up to 5 MB and 1,000 expense rows. Files are parsed in the browser. The app shows a preview and validates every row before the user confirms import; accepted rows are inserted into the signed-in user's `ledger_entries` table and protected by its RLS policies.

Required columns:

| Field | Accepted header names | Rules |
| --- | --- | --- |
| Vendor | `vendor`, `merchant`, `payee`, `supplier` | Required; 1–120 characters |
| Amount | `amount`, `total`, `cost` | Required; numeric and greater than zero; commas and a leading `$` are accepted |
| Category | `category`, `type` | Optional; defaults to `Other`; up to 80 characters |
| Currency | `currency` | Optional; defaults to `USD`; supported values: `USD`, `NGN`, `GBP`, `EUR` |
| Transaction date | `transaction_date`, `date` | Optional; defaults to today's date; when supplied, use `YYYY-MM-DD` |
| Note | `note`, `description`, `memo` | Optional; up to 240 characters |

Headers are case-insensitive. Unknown extra columns are ignored. A CSV with any invalid row is rejected as a whole. Re-importing the same file creates duplicate ledger rows; review the preview before confirming. Download [`public/sample-expenses.csv`](public/sample-expenses.csv) to try an eight-row file dated January through June 2026.

## Dashboard Behavior

- Monthly spend totals remain separated by currency; no exchange-rate conversion is applied.
- The month selector controls the spend and vendor summaries and the six-month activity chart.
- The initial selected month is the latest month represented in the loaded ledger, or the current month when the ledger is empty.
- After a successful CSV import, the selected month moves to the latest transaction month in that file.
- Manual records and CSV imports use the same ledger table. The SQL schema assigns the authenticated user ID by default, and RLS restricts reads, inserts, and deletes to that user.

## Express API Prototype

The Express API under `server/` is separate from the Supabase-backed browser workspace. It can be started with:

```bash
npm run dev:api
```

The health endpoint is `GET http://localhost:4000/api/health`. The API source contains registration/login, organization-scoped routes, CSV parsing, dashboard summary, findings, savings, and report-summary endpoints.

**Important:** the current API stores data in JavaScript `Map` objects in process memory. Data is lost when the process restarts. `DATABASE_URL` and Prisma are not yet wired into a durable repository, and the frontend dashboard does not call this API. The API is a development scaffold, not production-ready persistence. It also contains a development JWT fallback; configure a strong private `JWT_SECRET` and complete database-backed authorization and persistence before exposing it publicly.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite frontend on port 3000 |
| `npm run dev:api` | Start the API prototype with Node watch mode on port 4000 by default |
| `npm run start:api` | Start the API prototype without watch mode |
| `npm test` | Run the Vitest suite |
| `npm run lint` | Run ESLint with warnings treated as errors |
| `npm run prelaunch:check` | Check required launch configuration and report advisories |
| `npm run build` | Run the prelaunch check, generate SEO files, and build the Vite app |

An empty `VITE_SITE_URL` causes canonical and sitemap generation to be skipped. An empty `VITE_FORM_ENDPOINT` leaves public forms disabled. The Vite build may also report a large-chunk advisory; this does not by itself mean the build failed.

## Deployment

The frontend is a client-rendered Vite single-page app. [`vercel.json`](vercel.json) contains the Vercel SPA rewrite, security headers, and noindex route headers. Set the `VITE_*` variables in the deployment environment and configure the same Supabase callback URLs and allowed origins for the deployed domain.

The current security headers are configuration, not proof of the deployed response. Verify headers, OAuth redirects, RLS isolation, email confirmation, and form endpoint behavior on the actual preview/staging deployment. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) and [`PRELAUNCH_CHECKLIST.md`](PRELAUNCH_CHECKLIST.md).

## Repository Layout

```text
src/
	auth/                 Supabase session provider
	components/           Shared UI components
	config/               Site, page, environment, and product configuration
	dashboard/            Sign-up, sign-in, profile, ledger, and CSV import
	demo/                 Fictional read-only demo data
	lib/                  Supabase client
	App.jsx               Application pages and route components
	routes.jsx            Route registry
	styles.css            Site, workspace, responsive, and theme styles
supabase/schema.sql     User-scoped live ledger schema and RLS policies
server/                 Separate in-memory Express API prototype
public/                 Static assets, route manifest, and sample CSV
docs/                   Setup, deployment, and architecture notes
scripts/                SEO generation and prelaunch checks
```

## Product and Security Boundaries

The demo uses fictional sample data. The private ledger contains records supplied by its user; the app does not fetch transactions from financial accounts or automatically analyze provider invoices. CSV data is written to the Supabase ledger, so use a test project and non-sensitive sample data while evaluating the import flow. No financial outcome or savings recommendation is guaranteed.

The public anon key is intended for browser use only in combination with strict RLS. Never put a service-role key, `JWT_SECRET`, database URL credentials, or OAuth client secret in a `VITE_` variable or a committed file. Review Supabase RLS and deployed headers before using real customer data.