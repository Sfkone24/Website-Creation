# Website-Creation

We build modern websites for local businesses that have outdated or no websites, then sell them to those businesses. Current market: **HVAC in Bloomington, Indiana**.

## Start here
1. `sales/playbook.md` has this week's plan for closing the first client.
2. `prospecting/leads/` has one file per lead with the audit, pitch, call scripts, what to confirm, and sources.
3. `prospecting/prospects.csv` is the pipeline tracker.

## Layout
- `template/` is the one-page site (plain HTML/CSS, no dependencies): click-to-call, services, trust badges, FAQ, request form, schema.org local SEO
- `presets/hvac.json` holds trade defaults (services, FAQ, colors) that a client config can override
- `clients/<slug>/config.json` holds all per-client content. `"demo": true` adds the "concept preview" banner and `noindex`.
- **Demo vs final.** Demos are one page built from public facts. Final versions (`"demo": false`) add the owner's story and photos, a team section, a job gallery, real reviews, credentials, process, payments, hours, a map, and privacy and thanks pages. The Standard tier also gets an in-depth page for every service from `content/services/`. See the full sample at `/example-hvac/`.
- `sales/client-intake.md` lists what to collect from a paying client. `scripts/check-final.mjs <slug>` blocks launch until it's all there.
- `scripts/build.mjs` renders sites into `dist/<slug>/`
- `scripts/screenshot.mjs` saves desktop and mobile screenshots for outreach
- `sales/` has the playbook, pricing, outreach templates, proposal, and launch checklist

## Commands (Node 18+)
```
node scripts/build.mjs all          # or a single slug
node scripts/screenshot.mjs all     # needs Playwright (preinstalled in Claude Code cloud sessions)
node scripts/check-final.mjs <slug>  # launch gate for a paying client's final site
```
New lead: copy `clients/example-hvac` to `clients/<slug>`, fill in only real public facts, and rebuild.

## Hosting the demos (one-time setup)
`.github/workflows/deploy-demos.yml` builds every demo and publishes it to GitHub Pages on each push.
Turn it on once: **GitHub, then repo Settings, then Pages, then Source: "GitHub Actions"**. Demos then live at
`https://sfkone24.github.io/Website-Creation/<slug>/` (not indexed by search engines).
GitHub Pages on a private repo needs a paid GitHub plan. If yours isn't one, drag a `dist/<slug>/` folder into https://app.netlify.com/drop instead.

## Roadmap
1. Plain HTML/CSS template + HVAC preset (done)
2. Close the first Bloomington HVAC client
3. Plumbing and electrical presets, next Bloomington batch
4. Astro version with shared components, once a few clients are live
