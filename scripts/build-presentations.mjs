#!/usr/bin/env node
/**
 * Builds presentations listed in presentations.json into docs/
 *
 * Usage:
 *   pnpm build-all            – build every presentation in the manifest
 *   pnpm build-all <query>    – build only presentations whose title or path contains <query>
 *
 * Output goes to docs/.  Commit that folder and push – GitHub Pages serves it.
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  readFileSync(resolve(ROOT, "presentations.json"), "utf8"),
);
const BASE = manifest.base; // e.g. '/my-slides/'
const DOCS = resolve(ROOT, "docs");

// ── optional CLI filter ─────────────────────────────────────
const query = process.argv[2]?.toLowerCase();
const toBuild = query
  ? manifest.presentations.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.path.toLowerCase().includes(query),
    )
  : manifest.presentations;

if (toBuild.length === 0) {
  console.error(`No presentations match "${query}"`);
  process.exit(1);
}

// ── build ───────────────────────────────────────────────────
mkdirSync(DOCS, { recursive: true });

for (const pres of toBuild) {
  const relDir = dirname(pres.path); // e.g. courses/emerging-tech/s26/w01-…
  const outDir = resolve(DOCS, relDir); // absolute → works with slidev --out
  const presBase = BASE + relDir + "/"; // e.g. /my-slides/courses/.../

  console.log(`\n▸ ${pres.title}`);
  console.log(`  base  ${presBase}`);
  console.log(`  out   docs/${relDir}/\n`);

  execSync(
    `pnpm slidev build "${pres.path}" --base "${presBase}" --out "${outDir}"`,
    { cwd: ROOT, stdio: "inherit" },
  );
}

// ── always regenerate index + 404 from the full manifest ───
writeFileSync(resolve(DOCS, "index.html"), indexPage());
writeFileSync(resolve(DOCS, "404.html"), notFoundPage());
console.log("\n✓ docs/ is ready – commit and push to deploy\n");

// ── HTML helpers ────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── index page ──────────────────────────────────────────────
function indexPage() {
  // group: course → semester → [presentation]
  const tree = {};
  for (const p of manifest.presentations) {
    (tree[p.course] ??= {})[p.semester] ??= [];
    tree[p.course][p.semester].push(p);
  }

  let sections = "";
  for (const [course, semesters] of Object.entries(tree).sort()) {
    let semBlocks = "";
    for (const [sem, list] of Object.entries(semesters).sort()) {
      const links = list
        .map((p) => {
          const href = esc(BASE + dirname(p.path) + "/");
          return `      <li><a href="${href}">${esc(p.title)}</a></li>`;
        })
        .join("\n");
      semBlocks += `    <h3>${esc(sem)}</h3>\n    <ul>\n${links}\n    </ul>\n`;
    }
    sections += `  <section class="course">\n    <h2>${esc(course)}</h2>\n${semBlocks}  </section>\n`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Presentations</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 680px;
      margin: 0 auto;
      padding: 3.5rem 1.5rem;
      color: #1e293b;
      line-height: 1.6;
    }
    h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.25rem; }
    .subtitle { color: #64748b; margin-bottom: 2.5rem; font-size: 0.95rem; }
    .course { margin-bottom: 2rem; }
    h2 {
      font-size: 1.15rem;
      font-weight: 600;
      color: #334155;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.35rem;
      margin: 0 0 0.6rem;
    }
    h3 {
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #94a3b8;
      margin: 1rem 0 0.4rem;
    }
    ul { list-style: none; padding: 0; margin: 0; }
    li { margin: 0.3rem 0; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>My Slides</h1>
${sections}
</body>
</html>`;
}

// ── 404 page ────────────────────────────────────────────────
function notFoundPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Not found</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 480px; margin: 4rem auto; padding: 0 1.5rem; color: #1e293b; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <h1>Page not found</h1>
  <p><a href="${esc(BASE)}">← All presentations</a></p>
</body>
</html>`;
}
