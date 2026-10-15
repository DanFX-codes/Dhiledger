# Dhiledger Website — Implementation Plan

## Scope
Build a client-rendered React/Vite marketing site, read-only sample-data demo, and Supabase-backed private workspace for Dhiledger. The workspace uses Google OAuth and a user-owned manual expense ledger with realtime updates and row-level security. It does not include a financial analysis engine, external account integrations, CSV upload, organization sharing, or payment processing.

## Approach
- Use React, React Router, Vite and Framer Motion with a CSS token system and self-contained SVG/CSS product visuals.
- Keep configuration in `src/config/*`; use empty-safe defaults for company details, form endpoint, site URL, pricing, security evidence, consent and legal content.
- Register every route once in `src/routes.jsx`, drive navigation/footer/sitemap/prelaunch checks from that registry, and give demo/legal/not-available routes `noindex` metadata.
- Treat `/demo/*` and the homepage preview as read-only sample data sourced only from `src/demo/sampleData.js`.
- Build forms with accessible validation and fetch-only JSON submission when `VITE_FORM_ENDPOINT` is configured; never persist form data.
- Keep legal content modules empty and render no policy copy until the Dhiledger team supplies approved text.

## Design
### Alternatives considered
- **Editorial CFO dashboard** (0.06): calm financial clarity with strong data panels and restrained editorial rhythm.
- **Electric fintech lab** (0.04): higher contrast, luminous accents and more motion.
- **Soft enterprise atlas** (0.08): warmer neutrals and diagram-first navigation.

### Chosen direction: Editorial CFO dashboard
- **Design movement:** premium B2B fintech editorialism blended with dashboard information design.
- **Core principles:** clarity before conversion; evidence over spectacle; generous whitespace; every status has text plus an icon.
- **Color philosophy:** royal blue communicates decision confidence, deep navy anchors serious financial reading, and quiet slate surfaces keep sample figures legible without pretending to be live telemetry.
- **Layout paradigm:** asymmetric split sections, edge-aligned content rails and stacked evidence panels rather than a repetitive centered card grid.
- **Signature elements:** a blue “signal rail” behind hero data; compact uppercase section labels; sample-data badges with a dotted mark.
- **Interaction philosophy:** controls reveal or sort existing sample content only; no interaction implies account access or financial action.
- **Animation:** short opacity/translate reveals only for hierarchy; Framer Motion honors user reduced-motion preferences; no animated numbers or artificial progress.
- **Typography system:** system sans stack; oversized tight hero headings, readable 16–18px body copy, tabular figures for demo values, compact labels for metadata.
- **Brand essence:** financial intelligence for technology-driven companies; precise, transparent, practical.
- **Brand voice:** direct, calm and evidence-oriented. Example lines: “Find the money you’re losing. Prove the money you saved.” and “A recommendation is not a result.”
- **Wordmark & logo:** text wordmark with a small outlined ledger mark slot; no official icon is invented.
- **Signature brand color:** `#2457E6` royal blue.

## Project structure
- `src/config`: public configuration and status data.
- `src/components`: shared layout, UI, demo, forms and consent primitives.
- `src/pages.jsx`: marketing, legal, demo and not-available page compositions.
- `src/demo/sampleData.js`: all fictional demo figures and generic vendor names.
- `scripts`: SEO file generation and prelaunch warnings.
- `docs`: staged status, consent setup and deployment notes.

## Delivery workflow
Implement foundation and diagnostics first, then shared shell, legal templates, marketing, demo, forms/consent, and hardening/tooling. Run install, lint, build, tests and prelaunch checks before final reporting. Manual keyboard/screen-reader review and deployed-header effectiveness remain explicitly reported as not verified unless performed.
