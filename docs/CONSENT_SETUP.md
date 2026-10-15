# Consent setup

Consent is intentionally disabled in `src/config/content.js`. The current site renders no banner, writes no storage entry and loads no tracking or third-party embed.

Before enabling it, the Dhiledger team should inventory actual cookies and tools, confirm the applicable requirements, supply category labels/descriptions and reviewed copy, and update `consent.enabled` plus the configuration. Any future analytics or advertising script must be gated by its configured category and loaded only after the relevant consent decision. The isolated provider and consent shell are designed so this later work does not require a redesign.
