# Supabase workspace setup

The private dashboard uses Supabase Auth with Google OAuth and a per-user expense ledger. It does not connect to banks, accounting systems, or vendor accounts; records are entered manually. Do not use this starter workspace for sensitive financial account details.

## 1. Create the Supabase project

Create a project in Supabase, then open **Project Settings → API** and copy its Project URL and public anon key. Add these values to `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

The anon key is exposed to browsers by design. Never put a Supabase `service_role` key or Google client secret in a `VITE_` variable.

## 2. Enable Google sign-in

In Google Cloud Console, create an OAuth client for a web application. Add the Supabase project's callback URL shown in **Supabase → Authentication → Providers → Google** to Google's authorized redirect URIs. Enter the Google client ID and secret in the Supabase Google provider settings and enable the provider.

In **Supabase → Authentication → URL Configuration**, add the local and deployed app URLs to the redirect allow list:

- `http://localhost:3000/auth/callback`
- `https://your-domain.example/auth/callback`

Also set the site's local and production base URLs as the allowed redirect origins. Use the actual deployed domain in production.

## 3. Create the private ledger and enable realtime

Open the Supabase SQL Editor and run [`../supabase/schema.sql`](../supabase/schema.sql). It creates `public.ledger_entries`, enables row-level security, grants authenticated users only the operations used by the app, and adds the table to the `supabase_realtime` publication.

Every row is assigned to the current auth user by default. Select, insert, and delete policies all require `user_id = auth.uid()`. Keep RLS enabled; do not add a service-role key to the browser app.

## 4. Run and deploy

Restart Vite after creating `.env.local`, then visit `/login`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the deployment environment as well. The Vercel Content Security Policy already allows Supabase HTTPS and WebSocket connections.

The dashboard shows the signed-in user's manually entered records and live database changes. Currency totals are kept separate; no exchange-rate conversion, financial analysis, organization sharing, CSV import, or external account connection is implemented.