# Website-Creation

We build modern websites for local businesses that have outdated or no websites, then sell them to those businesses. First niche: local trades (plumbers, HVAC, electricians, landscapers).

## Layout
- `template/` reusable one-page site (plain HTML/CSS, no dependencies)
- `clients/<slug>/config.json` all per-client content and colors
- `scripts/build.mjs` renders a client site into `dist/<slug>/`
- `prospecting/` how to find and score prospects, plus the tracking CSV
- `sales/` outreach emails, call script, pricing, proposal template

## Build a demo
```
node scripts/build.mjs example-plumbing   # or: all
```
Open `dist/example-plumbing/index.html`. Requires Node 18+.

New client: copy `clients/example-plumbing` to `clients/<slug>`, edit `config.json`, rebuild. To host a demo, upload `dist/<slug>/` to Netlify, Cloudflare Pages or GitHub Pages.

## Roadmap
1. Plain HTML/CSS template (done)
2. Astro version with shared components, once the plain template has landed a few clients
3. Per-trade presets (HVAC, electrical, landscaping)
