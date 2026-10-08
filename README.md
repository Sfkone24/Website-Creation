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
- `scripts/build.mjs` renders sites into `dist/<slug>/`
- `scripts/screenshot.mjs` saves desktop and mobile screenshots for outreach
- `sales/` has the playbook, pricing, outreach templates, proposal, and launch checklist

## Commands (Node 18+)
```
node scripts/build.mjs all          # or a single slug
node scripts/screenshot.mjs all     # needs Playwright (preinstalled in Claude Code cloud sessions)
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
