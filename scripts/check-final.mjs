#!/usr/bin/env node
// Usage: node scripts/check-final.mjs <client-slug>
// Launch gate for a paying client's final site. Exits 1 if anything required is missing.
// Final sites must carry far more real detail than the demo; see sales/launch-checklist.md.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { root, loadConfig, loadLibrary } from "./config.mjs";

const slug = process.argv[2];
if (!slug) { console.error("Usage: node scripts/check-final.mjs <client-slug>"); process.exit(1); }

const cfg = loadConfig(slug);
const library = loadLibrary();
const errors = [];
const warnings = [];
const need = (ok, msg) => { if (!ok) errors.push(msg); };
const want = (ok, msg) => { if (!ok) warnings.push(msg); };
const words = (arr) => (arr ?? []).join(" ").split(/\s+/).filter(Boolean).length;
const asset = (f) => f && existsSync(join(root, "clients", slug, "assets", f));

// Mode
need(cfg.demo === false, `"demo" must be false for the final version`);
need(!cfg.sample, `"sample" is only for the fictional showcase site`);

// Contact basics, all confirmed with the owner
need(cfg.phone, "phone");
need(cfg.email, "email (where form requests are sent)");
need(cfg.hoursTable?.length || cfg.hours, "hours (hoursTable preferred)");
want(cfg.hoursTable?.length, "hoursTable gives a cleaner hours block than a single hours line");
need(cfg.street || cfg.serviceAreaOnly, `street address, or "serviceAreaOnly": true if the owner doesn't want an address published`);
need(cfg.siteUrl?.startsWith("https://"), "siteUrl (https://...) for canonical links and the sitemap");

// Story and trust
need(words(cfg.aboutParagraphs) >= 120, `about section needs 120+ words of the owner's real story (has ${words(cfg.aboutParagraphs)})`);
need(cfg.team?.length >= 1, "team: at least the owner, with name, role and bio");
for (const t of cfg.team ?? []) {
  need(t.name && t.role && t.bio, `team member "${t.name ?? "?"}" needs name, role and bio`);
  want(asset(t.photo), `team member "${t.name ?? "?"}" has no photo (or the file is missing from clients/${slug}/assets/)`);
}
need(cfg.credentials?.length >= 1, "credentials: license number(s), insurance, certifications or memberships");
need(cfg.reviews?.length >= 3, `at least 3 real reviews (has ${cfg.reviews?.length ?? 0})`);
for (const r of cfg.reviews ?? []) need(r.source && r.permission === true, `review from "${r.name}" needs "source" and "permission": true`);
want(cfg.reviewLinks?.length, "reviewLinks: link to their Google or Facebook reviews");

// Photos
need(cfg.gallery?.length >= 4, `gallery: at least 4 real job photos (has ${cfg.gallery?.length ?? 0})`);
for (const g of cfg.gallery ?? []) {
  need(asset(g.src), `gallery photo missing: clients/${slug}/assets/${g.src}`);
  need(g.alt, `gallery photo ${g.src} needs alt text`);
}
want(cfg.heroImage && asset(cfg.heroImage.src), "heroImage: a real photo of the owner, team or truck makes the biggest difference");
want(asset(cfg.logo), "logo file");
for (const f of ["logo", "favicon", "ogImage"]) if (cfg[f]) need(asset(cfg[f]), `${f} file missing: clients/${slug}/assets/${cfg[f]}`);
if (cfg.heroImage) need(asset(cfg.heroImage.src), `heroImage file missing: clients/${slug}/assets/${cfg.heroImage.src}`);

// Services: every one gets its own detail page
need(["starter", "standard"].includes(cfg.tier), `"tier" must be "starter" or "standard" (what the client paid for)`);
for (const s of cfg.services ?? []) {
  const details = s.details ?? (s.id && library[s.id]);
  if (cfg.tier !== "starter") need(details, `service "${s.name}" has no detail page: add an "id" from content/services/ or a "details" object`);
  need((s.desc ?? "").length >= 40, `service "${s.name}" needs a fuller card description`);
}

// How they work
need(cfg.process?.length >= 3, "process: 3-4 steps describing how a job goes with this company");
need(cfg.payments?.length >= 1, "payments: accepted payment methods");
want(cfg.guarantees?.length, "guarantees: warranty or workmanship guarantee, only if the owner actually offers one");
need(cfg.faq?.length >= 6, `FAQ needs 6+ questions including business-specific ones (has ${cfg.faq?.length ?? 0})`);
want(cfg.emergency, "emergency: what customers should do after hours");
want(cfg.social?.length, "social: Facebook or Google profile links");
want(cfg.mapEmbed, "mapEmbed: Google Maps embed of the service area");

// Sign-off
const c = cfg.confirmed ?? {};
need(c.facts === true, "confirmed.facts: owner confirmed every fact on the site");
need(c.photosPermission === true, "confirmed.photosPermission: owner supplied or approved every photo");
need(c.reviewsPermission === true, "confirmed.reviewsPermission: permission to quote each review");
need(c.copyApproved === true, "confirmed.copyApproved: owner read and approved all page copy");

console.log(`\nFinal-version check: ${cfg.businessName} (${slug})\n`);
if (errors.length) console.log(`✗ ${errors.length} required item(s) missing:\n${errors.map((e) => `  - ${e}`).join("\n")}\n`);
if (warnings.length) console.log(`! ${warnings.length} recommendation(s):\n${warnings.map((w) => `  - ${w}`).join("\n")}\n`);
if (!errors.length) console.log("✓ Ready to launch.\n");
process.exit(errors.length ? 1 : 0);
