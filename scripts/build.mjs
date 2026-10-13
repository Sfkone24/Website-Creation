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

// WCAG contrast helpers: brand accents are often too light for white button text or small labels.
const rgb = (hex) => hex.replace("#", "").match(/../g).map((h) => parseInt(h, 16));
const hex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const lum = (c) => c.map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => { const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const mix = (a, b, t) => hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t));
// Step the color toward `toward` until it reaches 4.5:1 against every background given.
function accessible(color, toward, backgrounds) {
  for (let t = 0; t <= 1; t += 0.02) {
    const c = mix(color, toward, t);
    if (backgrounds.every((bg) => contrast(c, bg) >= 4.5)) return c;
  }
  return toward;
}

function businessLd(cfg) {
  return {
    "@context": "https://schema.org",
    "@type": cfg.schemaType || "HVACBusiness",
    ...(cfg.siteUrl && { "@id": `${cfg.siteUrl}/#business`, url: `${cfg.siteUrl}/` }),
    name: cfg.businessName,
    description: cfg.tagline,
    telephone: cfg.phone,
    ...(cfg.email && { email: cfg.email }),
    ...((cfg.street || cfg.city) && {
      address: { "@type": "PostalAddress", ...(cfg.street && { streetAddress: cfg.street }), addressLocality: cfg.city, addressRegion: cfg.state, ...(cfg.zip && { postalCode: cfg.zip }), addressCountry: "US" },
    }),
    ...(cfg.openingHours && { openingHours: cfg.openingHours }),
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
  // The GitHub Pages demo host only carries demos, previews and the sample. A launched client site
  // lives on its own domain; publishing a second, indexable copy here would compete with it.
  if (process.env.DEMO_HOST && cfg.final && !cfg.preview && !cfg.sample) {
    console.log(`Skipped ${slug} (launched site, not published on the demo host)`);
    return;
  }
  // "preview": final-version layout shown to the client before launch, with "To be added" slots.
  cfg.preview = Boolean(cfg.final && cfg.preview);
  cfg.noindex = Boolean(cfg.demo || cfg.sample || cfg.preview);
  cfg.formPreview = Boolean(cfg.demo || cfg.sample || cfg.preview);
  cfg.phoneDigits = String(cfg.phone).replace(/\D/g, "");
  cfg.address ??= [cfg.street, cfg.city, [cfg.state, cfg.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  cfg.year = new Date().getFullYear();
  cfg.privacyUpdated ??= new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
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
    const rating = r.rating ?? 0;
    return { ...r, rating, stars: r.rating ? "★".repeat(rating) + "☆".repeat(5 - rating) : "" };
  });
  cfg.hasReviews = cfg.reviews.length > 0;
  cfg.reviewsGrid = cfg.reviews.length === 2 || cfg.reviews.length === 4 ? "grid-2r" : "grid-3";
  const pending = (has) => cfg.preview && !has;
  cfg.pendingCredentials = pending(cfg.credentials?.length);
  cfg.pendingProcess = pending(cfg.process?.length);
  cfg.pendingTeam = pending(cfg.team.length);
  cfg.pendingGallery = pending(cfg.gallery.length);
  cfg.pendingTiles = [];
  cfg.pendingReviews = pending(cfg.hasReviews);
  cfg.pendingPayments = pending(cfg.payments?.length);
  cfg.pendingHours = pending(cfg.hoursTable?.length || cfg.hours);
  cfg.pendingEmail = pending(cfg.email);
  cfg.showProcess = Boolean(cfg.process?.length || cfg.pendingProcess);
  cfg.processDraftPill = Boolean(cfg.preview && cfg.processIsDraft && cfg.process?.length);
  cfg.showQuickHelp = Boolean(cfg.final && cfg.quickHelp?.steps?.length);
  cfg.showSeasonal = Boolean(cfg.final && cfg.seasonal?.items?.length);
  cfg.showGallery = Boolean(cfg.gallery.length || cfg.pendingGallery);
  cfg.hasGoodToKnow = Boolean(cfg.guarantees?.length || cfg.payments?.length || cfg.pendingPayments);

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
      // Final sites list a few common warning signs on each service card.
      cardSigns: cfg.final && details?.signs ? details.signs.slice(0, 3) : [],
    };
  });
  if (cfg.pendingGallery) cfg.pendingTiles = cfg.services.slice(0, 4).map((s) => ({ label: s.name, iconSvg: s.iconSvg }));
  // 2 or 4 services read better as a 2-column grid than a 3-column grid with an orphan.
  cfg.servicesGrid = [2, 4].includes(cfg.services.length) ? "grid-2" : "grid-3";
  cfg.highlights = (cfg.highlights ?? []).map((h) => ({ ...h, iconSvg: icons[h.icon] ?? icons.check }));
  cfg.brandIconSvg = icons[cfg.brandIcon] ?? icons.flame;
  cfg.heroWater = cfg.heroCard === "water";
  cfg.heroThermo = !cfg.heroWater;
  cfg.icons = icons;
  // Darkened accent for white text and small labels on light backgrounds; lightened accent for dark sections.
  cfg.colors.accentStrong = accessible(cfg.colors.accent, "#000000", ["#ffffff", "#f4f7fb"]);
  cfg.colors.accentOnDark = accessible(cfg.colors.accent, "#ffffff", [cfg.colors.dark]);
  // Accent buttons: white text if the accent only needs a little darkening; bright accents (yellows,
  // light oranges) keep their color and get dark text instead, which stays closer to the brand.
  const nearWhiteOk = contrast(mix(cfg.colors.accent, "#000000", 0.2), "#ffffff") >= 4.5;
  cfg.colors.btnBg = nearWhiteOk ? accessible(cfg.colors.accent, "#000000", ["#ffffff"]) : cfg.colors.accent;
  cfg.colors.btnInk = nearWhiteOk ? "#ffffff" : "#16202c";

  // Alternate section backgrounds across whichever optional sections are present.
  const order = [
    ["servicesBg", true], ["highlightsBg", cfg.highlights.length], ["reviewsBg", cfg.hasReviews || cfg.pendingReviews], ["processBg", cfg.showProcess],
    ["aboutBg", true], ["quickHelpBg", cfg.showQuickHelp], ["seasonalBg", cfg.showSeasonal], ["galleryBg", cfg.showGallery],
    ["goodBg", cfg.hasGoodToKnow], ["areasBg", true], ["faqBg", true],
  ];
  let alt = false;
  for (const [key, present] of order) if (present) { cfg[key] = alt ? "sec-alt" : ""; alt = !alt; }

  const out = join(root, "dist", slug);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, "assets"), { recursive: true });
  writeFileSync(join(out, "assets", "style.css"), render(readFileSync(join(root, "template", "assets", "style.css"), "utf8"), cfg));
  const clientAssets = join(root, "clients", slug, "assets");
  if (existsSync(clientAssets)) cpSync(clientAssets, join(out, "assets", "client"), { recursive: true });
  // Fallback favicon: the brand icon in white on the primary color.
  if (!cfg.favicon) {
    const inner = cfg.brandIconSvg.replace(/^<svg[^>]*>|<\/svg>$/g, "");
    writeFileSync(join(out, "assets", "favicon.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="${cfg.colors.primary}"/><g transform="translate(4 4)" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</g></svg>`);
    cfg.favicon = "assets/favicon.svg";
  }

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
    pageDescription: cfg.metaDescription ?? `${cfg.tagline} Call ${cfg.phone}.`,
    canonical: canonical(""),
    pageJsonLd: ld(businessLd(cfg)),
  });

  if (cfg.final) {
    const withPages = cfg.services.filter((s) => s.pageUrl);
    for (const s of withPages) {
      page("service", s.pageUrl, "../../", {
        page: s,
        otherServices: withPages.filter((o) => o !== s),
        pageTitle: `${s.seoName ?? s.name} in ${cfg.primaryArea}, ${cfg.state} | ${cfg.businessName}`,
        pageDescription: s.details.metaDescription || s.details.intro,
        canonical: canonical(s.pageUrl),
        pageJsonLd: ld({
          "@context": "https://schema.org",
          "@type": "Service",
          name: s.name,
          description: s.details.intro,
          areaServed: cfg.serviceAreas,
          ...(cfg.siteUrl && { url: canonical(s.pageUrl) }),
          provider: { "@type": cfg.schemaType, ...(cfg.siteUrl && { "@id": `${cfg.siteUrl}/#business` }), name: cfg.businessName, telephone: cfg.phone },
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

  if (cfg.final && cfg.siteUrl && !cfg.sample && !cfg.preview) {
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
