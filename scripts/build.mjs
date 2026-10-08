#!/usr/bin/env node
// Usage: node scripts/build.mjs <client-slug>   (or "all")
// Renders template/ with clients/<slug>/config.json into dist/<slug>/.
import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Supports {{key}}, {{a.b}}, {{#list}}...{{/list}} (with {{.}} for strings), and {{^key}}...{{/key}} (if empty).
function render(tpl, ctx) {
  const get = (o, p) => (p === "." ? o : p.split(".").reduce((v, k) => (v == null ? v : v[k]), o));
  tpl = tpl.replace(/{{#([\w.]+)}}([\s\S]*?){{\/\1}}/g, (_, k, inner) => {
    const v = get(ctx, k);
    if (Array.isArray(v)) return v.map((item) => render(inner, typeof item === "object" ? { ...ctx, ...item } : { ...ctx, ".": item })).join("");
    return v ? render(inner, ctx) : "";
  });
  tpl = tpl.replace(/{{\^([\w.]+)}}([\s\S]*?){{\/\1}}/g, (_, k, inner) => {
    const v = get(ctx, k);
    return !v || (Array.isArray(v) && !v.length) ? render(inner, ctx) : "";
  });
  return tpl.replace(/{{([\w.]+)}}/g, (_, k) => {
    const v = get(ctx, k);
    return v == null ? "" : esc(v);
  });
}

function build(slug) {
  const cfgPath = join(root, "clients", slug, "config.json");
  if (!existsSync(cfgPath)) throw new Error(`No config for "${slug}" at ${cfgPath}`);
  const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
  cfg.phoneDigits = String(cfg.phone).replace(/\D/g, "");
  cfg.hasReviews = Boolean(cfg.reviews && cfg.reviews.length);
  cfg.year = new Date().getFullYear();
  const out = join(root, "dist", slug);
  mkdirSync(out, { recursive: true });
  cpSync(join(root, "template", "assets"), join(out, "assets"), { recursive: true });
  writeFileSync(join(out, "index.html"), render(readFileSync(join(root, "template", "index.html"), "utf8"), cfg));
  writeFileSync(join(out, "assets", "style.css"), render(readFileSync(join(root, "template", "assets", "style.css"), "utf8"), cfg));
  console.log(`Built dist/${slug}/`);
}

const arg = process.argv[2];
if (!arg) { console.error("Usage: node scripts/build.mjs <client-slug|all>"); process.exit(1); }
const slugs = arg === "all" ? readdirSync(join(root, "clients")) : [arg];
slugs.forEach(build);
