#!/usr/bin/env node
// Usage: node scripts/screenshot.mjs <client-slug|all>
// Saves desktop + mobile screenshots of dist/<slug>/ into dist/<slug>/screenshots/ (for outreach messages).
import { readdirSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); }
catch { playwright = require(join(execSync("npm root -g").toString().trim(), "playwright")); }

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = process.argv[2];
if (!arg) { console.error("Usage: node scripts/screenshot.mjs <client-slug|all>"); process.exit(1); }
const slugs = arg === "all" ? readdirSync(join(root, "dist")) : [arg];

const browser = await playwright.chromium.launch();
for (const slug of slugs) {
  const url = pathToFileURL(join(root, "dist", slug, "index.html")).href;
  const out = join(root, "dist", slug, "screenshots");
  mkdirSync(out, { recursive: true });
  for (const [name, viewport, mobile] of [["desktop", { width: 1366, height: 860 }, false], ["mobile", { width: 390, height: 844 }, true]]) {
    const page = await browser.newPage({ viewport, isMobile: mobile, deviceScaleFactor: mobile ? 2 : 1 });
    await page.goto(url, { waitUntil: "load" });
    await page.screenshot({ path: join(out, `${name}.png`) });
    await page.screenshot({ path: join(out, `${name}-full.png`), fullPage: true });
    await page.close();
  }
  console.log(`Screenshots: dist/${slug}/screenshots/`);
}
await browser.close();
