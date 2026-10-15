# Dhiledger Website TODO

## Foundation and configuration
- [ ] React/Vite client-rendered foundation with route registry, metadata, noindex rules, route error handling, scroll/focus behavior and `/manus-routes.json`.
- [ ] Public configuration modules with safe empty defaults; only `src/config/env.js` reads `import.meta.env`.
- [ ] Royal-blue B2B fintech design tokens, self-contained styling, system font stack, reduced-motion support and no third-party asset requests.

## Shared shell and marketing
- [ ] Keyboard-operable sticky header, responsive mobile menu, skip link, footer, breadcrumbs, CTA links and page shell.
- [ ] Homepage hero, problem framing, capability cards, six-stage workflow, sample dashboard preview, savings-verification explanation, use cases, security intent, FAQ and final CTA.
- [ ] Product, how-it-works, use-cases, pricing, security, about, FAQ and resources pages with truthful configured content.

## Authenticated workspace and unavailable routes
- [ ] `/legal` plus all 17 empty legal templates; legal content regions stay empty until approved copy exists.
- [ ] `/login` supports Google OAuth when Supabase is configured; `/auth/callback` completes the session.
- [ ] `/dashboard/*` requires authentication and shows only the signed-in user's live, manually entered ledger records; `/settings/*` remains unavailable.
- [ ] Supabase row-level security isolates each user's ledger records and Realtime updates.
- [ ] Unknown paths render a noindex not-found page.

## Sample-data demo
- [ ] `/demo` and all specified demo routes use one visible “Demo · Sample data, not a live account” banner.
- [ ] Charts/tables/filtering/sorting/detail panels are read-only, reset on reload, use fictional generic vendors, and provide text summaries/tables.
- [ ] Export/download/connect/upload/edit/approve/delete controls are absent or disabled with visible reasons.

## Forms and consent
- [ ] Request-access and contact forms validate fields, show accessible inline errors/error summary/live status, honor a honeypot, and submit only to configured endpoint with a 10-second timeout.
- [ ] Missing endpoint disables submission with the required notice; endpoint success/failure states are explicit and do not persist personal data.
- [ ] Consent components exist but render nothing while disabled; setup instructions document how to enable later.

## Hardening and verification
- [ ] Vercel SPA rewrite, CSP/security headers, noindex header rules and deployment notes.
- [ ] SEO script writes sitemap/robots only when `VITE_SITE_URL` is set and excludes demo/legal/not-available/unpopulated resources routes.
- [ ] ESLint, Vitest/RTL tests, prelaunch warnings, status report and checklist.
