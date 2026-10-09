#!/usr/bin/env node
// Usage: node scripts/build.mjs <client-slug>   (or "all")
// Renders template/ with clients/<slug>/config.json into dist/<slug>/.
//
// Demo mode ("demo": true): one page, concept banner, noindex.
// Final mode ("demo": false): home page plus a detail page per service (content/services/<id>.json
// or the service's own "details"), privacy and thanks pages, and sitemap/robots when "siteUrl" is set.
import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { icons } from "./icons.mjs";
import { root, loadConfig, loadLibrary, clientSlugs } from "./config.mjs";
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const slugify = (s) => String(s).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// Lowercase for use mid-sentence, keeping acronyms like HVAC or A.O. intact.
const midSentence = (s) => s.split(" ").map((w) => (/^[A-Z.&]{2,}$/.test(w) ? w : w.toLowerCase())).join(" ");

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

// Loads template/<name>.html and inlines {{> partial}} from template/partials/.
function loadTemplate(name) {
  return readFileSync(join(root, "template", `${name}.html`), "utf8").replace(/{{>\s*([\w-]+)\s*}}/g, (_, p) => loadTemplate(`partials/${p}`));
}

const ld = (data) => JSON.stringify(data, null, 2).replace(/</g, "\\u003c");

function businessLd(cfg) {
  return {
    "@context": "https://schema.org",
    "@type": cfg.schemaType || "HVACBusiness",
    ...(cfg.siteUrl && { "@id": `${cfg.siteUrl}/#business`, url: `${cfg.siteUrl}/` }),
    name: cfg.businessName,
    description: cfg.tagline,
    telephone: cfg.phone,
    ...(cfg.email && { email: cfg.email }),
    ...(cfg.street && {
      address: { "@type": "PostalAddress", streetAddress: cfg.street, addressLocality: cfg.city, addressRegion: cfg.state, postalCode: cfg.zip, addressCountry: "US" },
    }),
    areaServed: cfg.serviceAreas,
    ...(cfg.foundingYear && { foundingDate: String(cfg.foundingYear) }),
    ...(cfg.siteUrl && cfg.logo && { logo: `${cfg.siteUrl}/${cfg.logo}` }),
    ...(cfg.ogImageUrl && { image: cfg.ogImageUrl }),
    ...(cfg.social?.length && { sameAs: cfg.social.map((s) => s.url) }),
    ...(cfg.final && cfg.services.length && {
      hasOfferCatalog: { "@type": "OfferCatalog", name: cfg.servicesHeading, itemListElement: cfg.services.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.name } })) },
    }),
  };
}

const clientAsset = (p) => (p ? `assets/client/${p}` : p);

function build(slug, library) {
  const cfg = loadConfig(slug);
  cfg.final = !cfg.demo;
  cfg.noindex = Boolean(cfg.demo || cfg.sample);
  cfg.formPreview = Boolean(cfg.demo || cfg.sample);
  cfg.phoneDigits = String(cfg.phone).replace(/\D/g, "");
  cfg.address ??= [cfg.street, cfg.city, [cfg.state, cfg.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  cfg.year = new Date().getFullYear();
  cfg.buildDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  cfg.primaryArea = cfg.serviceAreas?.[0] ?? cfg.city;
  cfg.processHeading ??= "What to expect when you call";
  cfg.siteUrl = cfg.siteUrl?.replace(/\/$/, "");

  // Client photos live in clients/<slug>/assets/ and are referenced by file name in the config.
  cfg.logo = clientAsset(cfg.logo);
  cfg.favicon = clientAsset(cfg.favicon);
  if (cfg.heroImage) cfg.heroImage = { ...cfg.heroImage, src: clientAsset(cfg.heroImage.src) };
  cfg.gallery = (cfg.gallery ?? []).map((g) => ({ ...g, src: clientAsset(g.src) }));
  cfg.team = (cfg.team ?? []).map((t) => ({ ...t, photo: clientAsset(t.photo) }));
  cfg.ogImageUrl = cfg.siteUrl && cfg.ogImage ? `${cfg.siteUrl}/${clientAsset(cfg.ogImage)}` : "";

  cfg.reviews = (cfg.reviews ?? []).map((r) => {
    const rating = r.rating ?? 5;
    return { ...r, rating, stars: "★".repeat(rating) + "☆".repeat(5 - rating) };
  });
  cfg.hasReviews = cfg.reviews.length > 0;
  cfg.hasGoodToKnow = Boolean(cfg.guarantees?.length || cfg.payments?.length);

  cfg.services = (cfg.services ?? []).map((s) => {
    const details = s.details ?? (s.id && library[s.id]) ?? null;
    const pageSlug = s.id ?? slugify(s.name);
    return {
      ...s,
      iconSvg: icons[s.icon] ?? icons.wrench,
      lowerName: midSentence(s.name),
      details,
      pageSlug,
      // Starter tier is a single rich home page; Standard adds a page per service.
      pageUrl: cfg.final && details && cfg.tier !== "starter" ? `services/${pageSlug}/` : "",
    };
  });
  // 2 or 4 services read better as a 2-column grid than a 3-column grid with an orphan.
  cfg.servicesGrid = [2, 4].includes(cfg.services.length) ? "grid-2" : "grid-3";
  cfg.highlights = (cfg.highlights ?? []).map((h) => ({ ...h, iconSvg: icons[h.icon] ?? icons.check }));
  cfg.brandIconSvg = icons[cfg.brandIcon] ?? icons.flame;
  cfg.heroWater = cfg.heroCard === "water";
  cfg.heroThermo = !cfg.heroWater;
  cfg.icons = icons;

  // Alternate section backgrounds across whichever optional sections are present.
  const order = [
    ["servicesBg", true], ["highlightsBg", cfg.highlights.length], ["processBg", cfg.process?.length], ["aboutBg", true],
    ["galleryBg", cfg.gallery.length], ["reviewsBg", cfg.hasReviews], ["goodBg", cfg.hasGoodToKnow], ["areasBg", true], ["faqBg", true],
  ];
  let alt = false;
  for (const [key, present] of order) if (present) { cfg[key] = alt ? "sec-alt" : ""; alt = !alt; }

  const out = join(root, "dist", slug);
  // Keep screenshots between builds; regenerate everything else.
  for (const f of existsSync(out) ? readdirSync(out) : []) if (f !== "screenshots") rmSync(join(out, f), { recursive: true, force: true });
  mkdirSync(join(out, "assets"), { recursive: true });
  writeFileSync(join(out, "assets", "style.css"), render(readFileSync(join(root, "template", "assets", "style.css"), "utf8"), cfg));
  const clientAssets = join(root, "clients", slug, "assets");
  if (existsSync(clientAssets)) cpSync(clientAssets, join(out, "assets", "client"), { recursive: true });

  const pages = [];
  const page = (tplName, path, base, extra) => {
    const ctx = { ...cfg, base, ...extra };
    const dir = join(out, path);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), render(loadTemplate(tplName), ctx));
    pages.push(path);
  };
  const canonical = (path) => (cfg.siteUrl ? `${cfg.siteUrl}/${path}` : "");

  page("index", "", "", {
    pageTitle: `${cfg.businessName} | ${cfg.seoTrade} in ${cfg.primaryArea}, ${cfg.state}`,
    pageDescription: `${cfg.tagline} Call ${cfg.phone}.`,
    canonical: canonical(""),
    pageJsonLd: ld(businessLd(cfg)),
  });

  if (cfg.final) {
    const withPages = cfg.services.filter((s) => s.pageUrl);
    for (const s of withPages) {
      page("service", s.pageUrl, "../../", {
        page: s,
        otherServices: withPages.filter((o) => o !== s),
        pageTitle: `${s.name} in ${cfg.primaryArea}, ${cfg.state} | ${cfg.businessName}`,
        pageDescription: s.details.metaDescription || s.details.intro,
        canonical: canonical(s.pageUrl),
        pageJsonLd: ld({
          "@context": "https://schema.org",
          "@type": "Service",
          name: s.name,
          description: s.details.intro,
          areaServed: cfg.serviceAreas,
          provider: cfg.siteUrl ? { "@id": `${cfg.siteUrl}/#business` } : { "@type": cfg.schemaType, name: cfg.businessName, telephone: cfg.phone },
        }),
      });
    }
    page("privacy", "privacy/", "../", {
      pageTitle: `Privacy policy | ${cfg.businessName}`,
      pageDescription: `How ${cfg.businessName} handles information sent through this website.`,
      canonical: canonical("privacy/"),
      pageJsonLd: ld(businessLd(cfg)),
    });
  }
  page("thanks", "thanks/", "../", {
    pageTitle: `Thank you | ${cfg.businessName}`,
    pageDescription: `Your request was sent to ${cfg.businessName}.`,
    noindex: true,
    canonical: "",
    pageJsonLd: ld(businessLd(cfg)),
  });

  if (cfg.final && cfg.siteUrl && !cfg.sample) {
    const urls = pages.filter((p) => p !== "thanks/").map((p) => `  <url><loc>${cfg.siteUrl}/${p}</loc></url>`).join("\n");
    writeFileSync(join(out, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
    writeFileSync(join(out, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${cfg.siteUrl}/sitemap.xml\n`);
  }
  console.log(`Built dist/${slug}/ (${pages.length} page${pages.length === 1 ? "" : "s"})`);
}

const arg = process.argv[2];
if (!arg) { console.error("Usage: node scripts/build.mjs <client-slug|all>"); process.exit(1); }
const library = loadLibrary();
const slugs = arg === "all" ? clientSlugs() : [arg];
slugs.forEach((s) => build(s, library));
