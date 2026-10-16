# Deployment notes

The site is a client-rendered Vite build intended for Vercel static hosting. `vercel.json` contains the SPA rewrite, response headers and noindex route groups. The CSP includes an inline-style allowance because the current UI uses React-controlled `style` values for sample chart bars; it does not permit third-party scripts or frames.

When `VITE_FORM_ENDPOINT` is configured, add that endpoint origin to `connect-src` in `vercel.json` and review the endpoint's data handling before deployment. `VITE_SITE_URL` enables canonical tags, Open Graph URL values and sitemap/robots generation.

The private workspace uses Supabase email/password auth and configured Google/GitHub OAuth, with realtime ledger records. Follow [the Supabase setup guide](./SUPABASE_SETUP.md), set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in each environment, and keep row-level security enabled. Only the public anon key belongs in the browser; never expose the service-role key. The workspace supports manual records and validated CSV imports, but is not connected to financial institutions or external spend sources.

The separate Express API under `server/` is an in-memory prototype and is not connected to the frontend workspace. Do not deploy it as a durable production API until its database repository, secret configuration, and authorization model are completed.

The header rules are configuration, not proof that a deployment enforces them. Verify response headers on the actual deployment before treating them as active.
