#!/usr/bin/env node
// Usage: node scripts/build.mjs <client-slug>   (or "all")
// Renders template/ with clients/<slug>/config.json into dist/<slug>/.
import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { icons } from "./icons.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Supports {{key}}, {{a.b}}, {{{raw}}}, {{#list}}...{{/list}} (with {{.}} for strings), and {{^key}}...{{/key}} (if empty).
function render(tpl, ctx) {
  const get = (o, p) => (p === "." ? o["."] : p.split(".").reduce((v, k) => (v == null ? v : v[k]), o));
  tpl = tpl.replace(/{{#([\w.]+)}}([\s\S]*?){{\/\1}}/g, (_, k, inner) => {
    const v = get(ctx, k);
    if (Array.isArray(v)) return v.map((item) => render(inner, typeof item === "object" ? { ...ctx, ...item } : { ...ctx, ".": item })).join("");
    return v ? render(inner, ctx) : "";
  });
  tpl = tpl.replace(/{{\^([\w.]+)}}([\s\S]*?){{\/\1}}/g, (_, k, inner) => {
    const v = get(ctx, k);
    return !v || (Array.isArray(v) && !v.length) ? render(inner, ctx) : "";
  });
  tpl = tpl.replace(/{{{([\w.]+)}}}/g, (_, k) => get(ctx, k) ?? "");
  return tpl.replace(/{{([\w.]+)}}/g, (_, k) => {
    const v = get(ctx, k);
    return v == null ? "" : esc(v);
  });
}

function jsonLd(cfg) {
  const data = {
    "@context": "https://schema.org",
    "@type": cfg.schemaType || "HVACBusiness",
    name: cfg.businessName,
    description: cfg.tagline,
    telephone: cfg.phone,
    ...(cfg.email && { email: cfg.email }),
    ...(cfg.street && {
      address: { "@type": "PostalAddress", streetAddress: cfg.street, addressLocality: cfg.city, addressRegion: cfg.state, postalCode: cfg.zip, addressCountry: "US" },
    }),
    areaServed: cfg.serviceAreas,
    ...(cfg.foundingYear && { foundingDate: String(cfg.foundingYear) }),
  };
  return JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
}

function build(slug) {
  const cfgPath = join(root, "clients", slug, "config.json");
  if (!existsSync(cfgPath)) throw new Error(`No config for "${slug}" at ${cfgPath}`);
  let cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
  if (cfg.preset) {
    // Preset supplies trade defaults (services, FAQ, colors); client config wins on every key it sets.
    const preset = JSON.parse(readFileSync(join(root, "presets", `${cfg.preset}.json`), "utf8"));
    cfg = { ...preset, ...cfg, colors: { ...preset.colors, ...cfg.colors }, faq: [...(cfg.faq ?? []), ...(preset.faq ?? [])] };
  }
  cfg.phoneDigits = String(cfg.phone).replace(/\D/g, "");
  cfg.address ??= [cfg.street, cfg.city, [cfg.state, cfg.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  cfg.year = new Date().getFullYear();
  cfg.hasReviews = Boolean(cfg.reviews?.length);
  cfg.primaryArea = cfg.serviceAreas?.[0] ?? cfg.city;
  cfg.services = (cfg.services ?? []).map((s) => ({ ...s, iconSvg: icons[s.icon] ?? icons.wrench }));
  // 2 or 4 services read better as a 2-column grid than a 3-column grid with an orphan.
  cfg.servicesGrid = [2, 4].includes(cfg.services.length) ? "grid-2" : "grid-3";
  cfg.highlights = (cfg.highlights ?? []).map((h) => ({ ...h, iconSvg: icons[h.icon] ?? icons.check }));
  cfg.brandIconSvg = icons[cfg.brandIcon] ?? icons.flame;
  cfg.heroWater = cfg.heroCard === "water";
  cfg.heroThermo = !cfg.heroWater;
  cfg.icons = icons;
  cfg.jsonLd = jsonLd(cfg);
  const out = join(root, "dist", slug);
  mkdirSync(out, { recursive: true });
  cpSync(join(root, "template", "assets"), join(out, "assets"), { recursive: true });
  for (const f of ["index.html", "assets/style.css"]) {
    writeFileSync(join(out, f), render(readFileSync(join(root, "template", f), "utf8"), cfg));
  }
  console.log(`Built dist/${slug}/`);
}

const arg = process.argv[2];
if (!arg) { console.error("Usage: node scripts/build.mjs <client-slug|all>"); process.exit(1); }
const slugs = arg === "all" ? readdirSync(join(root, "clients")) : [arg];
slugs.forEach(build);
