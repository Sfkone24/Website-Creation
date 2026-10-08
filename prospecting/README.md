# Prospecting

Find local trades businesses with no site or a bad one, then build a demo before pitching.

## Where to look
- Google Maps: search "<trade> in <city>". Open each listing. No website link = top prospect.
- Facebook-only businesses, Yelp/Angi-only listings.
- Sites that fail the checklist below.

## Score each site (0-10, higher = better prospect)
+3 No website at all
+2 Not mobile friendly (test on a phone)
+1 No HTTPS (browser shows "Not secure")
+1 No click-to-call phone number
+1 Looks pre-2015 or is broken or slow
+1 No services list or service area
+1 Contact form missing or broken

Pitch anyone scoring 4+. Log them in `prospects.csv`.
Statuses: `new` > `demo_built` > `contacted` > `replied` > `won` / `lost`.

## Workflow
1. Add the business to `prospects.csv`.
2. Create `clients/<slug>/config.json` (copy `clients/example-plumbing`) using only information that is public on their listing.
3. `node scripts/build.mjs <slug>` and host the demo (see root README).
4. Send the outreach from `sales/`, then update `status`.

## Rules
- Use only real, public business details. Never invent reviews, licenses or years in business: leave them out of the config instead.
- Don't copy a business's logo, photos or text without permission. Use placeholders in demos.
- Comply with local email and cold-call laws (CAN-SPAM, CASL, GDPR, Do-Not-Call). Include your identity and an opt-out in every email.
