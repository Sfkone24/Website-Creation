// Shared loaders for build.mjs and check-final.mjs.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Client config merged over its trade preset; client config wins on every key it sets.
export function loadConfig(slug) {
  const cfgPath = join(root, "clients", slug, "config.json");
  if (!existsSync(cfgPath)) throw new Error(`No config for "${slug}" at ${cfgPath}`);
  const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
  if (!cfg.preset) return cfg;
  const preset = JSON.parse(readFileSync(join(root, "presets", `${cfg.preset}.json`), "utf8"));
  return { ...preset, ...cfg, colors: { ...preset.colors, ...cfg.colors }, faq: [...(cfg.faq ?? []), ...(preset.faq ?? [])] };
}

// Service page content library: content/services/<id>.json.
export function loadLibrary() {
  const dir = join(root, "content", "services");
  const lib = {};
  if (!existsSync(dir)) return lib;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const s = JSON.parse(readFileSync(join(dir, f), "utf8"));
    lib[s.id] = s;
  }
  return lib;
}

export const clientSlugs = () => readdirSync(join(root, "clients"));
