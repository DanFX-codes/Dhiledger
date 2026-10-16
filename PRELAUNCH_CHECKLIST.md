# Dhiledger prelaunch checklist

This checklist is internal and should remain incomplete until the website and authenticated workspace are fully configured and reviewed.

## Company and product inputs
- [ ] Confirm legal name, registration details and registered office.
- [ ] Confirm contact email and any phone/social links.
- [ ] Confirm approved wordmark/icon asset.
- [ ] Confirm every capability status; no capability is marked Available by default.
- [ ] Approve pricing content, or leave pricing unpublished.

## Legal and security
- [ ] Supply policy text for each of the 17 legal templates.
- [ ] Review legal text with qualified counsel.
- [ ] Set `contentReady` only after approval and narrow the blanket legal noindex header.
- [ ] Supply evidence for each security statement before changing it to verified.
- [ ] Confirm the financial/product disclaimer content before publishing.

## Forms and data handling
- [ ] Select a form endpoint and document its data handling.
- [ ] Add the endpoint origin to CSP `connect-src`.
- [ ] Confirm optional consent copy only after a real tool/cookie inventory.
- [ ] Confirm that forms do not invite financial account details or sensitive files.

## Authenticated workspace
- [ ] Configure Supabase email/password, Google, and GitHub providers as intended; verify local and production redirect URLs.
- [ ] Run `supabase/schema.sql` and verify row-level security prevents cross-user reads, writes and deletes.
- [ ] Test CSV preview, validation, month alignment, and import using non-sensitive sample data.
- [ ] Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in local and deployment environments; never expose a service-role key.
- [ ] Verify OAuth, session expiry, sign-out, realtime updates and error states in preview/staging.
- [ ] Confirm that manual-entry-only scope is clear and that no unsupported financial integrations are implied.

## Operations and review
- [ ] Set `VITE_SITE_URL` and confirm the domain.
- [ ] Review accessibility with keyboard and assistive technology.
- [ ] Review responsive layouts at 320, 768 and 1280 CSS pixels.
- [ ] Re-check all capability statuses and sample-data labels.
- [ ] Verify headers on the deployed preview/staging site.
- [ ] Keep deployment to preview or staging until the above items are complete.
