#!/usr/bin/env node
/**
 * Builds presentations listed in presentations.json into docs/
 *
 * Usage:
 *   pnpm build-all            – build every presentation in the manifest
 *   pnpm build-all <query>    – build only presentations whose title or path contains <query>
 *   pnpm build-all --force    – rebuild everything, ignoring the cache
 *   pnpm build-all "week 2" --force
 *
 * Output goes to docs/.  Commit that folder and push – GitHub Pages serves it.
 *
 * Image optimisation (runs before each build, idempotent):
 *   – Raster images (.jpg, .jpeg, .png, .gif, .webp) anywhere below each
 *     presentation's images/ directory are converted to WebP (quality 82)
 *     and resized to a max dimension of 2880px (2× retina of the 1440 canvas
 *     width).
 *   – Non-raster files (.mp4, .mov, .svg, …) are left untouched.
 *   – Already-processed images are tracked in images/.optimized.json (a small
 *     sidecar committed alongside your images).  A file is re-processed only
 *     when its content changes (hash mismatch) or it is brand new.
 *   – The .md file is updated automatically when a filename changes extension
 *     (e.g. pope.png → pope.webp).
 */

import { execSync } from "node:child_process";
import {
  readFileSync,
  writeFileSync,
  unlinkSync,
  mkdirSync,
  rmSync,
  existsSync,
  statSync,
  readdirSync,
} from "node:fs";
import { resolve, dirname, join, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Resolve pnpm: prefer PATH, fall back to common user-install locations
const PNPM = (() => {
  for (const candidate of [
    "pnpm",
    `${process.env.HOME}/.local/share/pnpm/pnpm`,
    `${process.env.HOME}/Library/pnpm/pnpm`,
    "/opt/homebrew/bin/pnpm",
    "/usr/local/bin/pnpm",
  ]) {
    try { execSync(`command -v ${candidate}`, { stdio: "ignore" }); return candidate; } catch {}
  }
  throw new Error("pnpm not found – install it or add it to PATH");
})();

const manifest = JSON.parse(
  readFileSync(resolve(ROOT, "presentations.json"), "utf8"),
);
const BASE = manifest.base; // e.g. '/my-slides/'
const DOCS = resolve(ROOT, "docs");

// ── flags + CLI filter ──────────────────────────────────────
const args = process.argv.slice(2);
const forceRebuild = args.includes("--force");
const query = args.find((a) => !a.startsWith("--"))?.toLowerCase();
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

// ── image optimisation ──────────────────────────────────────
// Loaded lazily so the script still works if sharp is somehow absent.
let sharpLib = null;
async function getSharp() {
  if (!sharpLib) {
    const mod = await import("sharp");
    sharpLib = mod.default;
  }
  return sharpLib;
}

const RASTER_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);
const SIDECAR_NAME = ".optimized.json";
const WEBP_QUALITY = 82;
const MAX_DIMENSION = 2880;

function fileHash(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function listFiles(dir, relativeDir = "") {
  const files = [];
  for (const entry of readdirSync(join(dir, relativeDir), { withFileTypes: true })) {
    const relativePath = join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(dir, relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }
  return files;
}

/**
 * Optimise all raster images in <presDir>/images/ and its subdirectories:
 *   – Convert non-WebP rasters to .webp (quality 82, max 2880px)
 *   – Resize existing .webp files that exceed MAX_DIMENSION
 *   – Update ./images/… references inside the .md file when filenames change
 *   – Record processed files in images/.optimized.json (sidecar), using paths
 *     relative to images/ for nested files
 */
async function optimizeImages(presPath) {
  const presDir = resolve(ROOT, dirname(presPath));
  const imagesDir = join(presDir, "images");
  if (!existsSync(imagesDir)) return;

  const sharp = await getSharp();

  // Load sidecar
  const sidecarPath = join(imagesDir, SIDECAR_NAME);
  let sidecar = {};
  if (existsSync(sidecarPath)) {
    try {
      sidecar = JSON.parse(readFileSync(sidecarPath, "utf8"));
    } catch {
      // corrupt sidecar – start fresh
    }
  }

  const mdPath = resolve(ROOT, presPath);
  let mdContent = readFileSync(mdPath, "utf8");
  let mdChanged = false;

  const files = listFiles(imagesDir).filter((f) => f !== SIDECAR_NAME);

  // Build a set of existing relative filenames for recovery detection
  const existingFiles = new Set(files);

  for (const filename of files) {
    const filePath = join(imagesDir, filename);
    if (!statSync(filePath).isFile()) continue;

    const ext = extname(filename).toLowerCase();
    if (!RASTER_EXTS.has(ext)) continue; // skip videos, svgs, etc.

    const currentHash = fileHash(filePath);
    const isAlreadyWebp = ext === ".webp";

    // Recovery: if this is a .webp that exists but has no sidecar entry,
    // it was likely produced by an interrupted previous run. Register it
    // and update any stale .md references from the original extension.
    if (isAlreadyWebp && !sidecar[filename]) {
      const nameWithoutExt = basename(filename, ".webp");
      // Update refs for any original-extension variant that no longer exists
      for (const origExt of [".jpg", ".jpeg", ".png", ".gif"]) {
        const origFilename = join(dirname(filename), nameWithoutExt + origExt);
        if (!existingFiles.has(origFilename)) {
          const escapedOrig = origFilename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const refRegex = new RegExp(`(images/)${escapedOrig}`, "g");
          const newMd = mdContent.replace(refRegex, `$1${filename}`);
          if (newMd !== mdContent) { mdContent = newMd; mdChanged = true; }
        }
      }
      sidecar[filename] = currentHash;
      process.stdout.write(`  img  ${filename}  [recovered orphan]\n`);
      continue;
    }

    // Check if already processed and unchanged
    const sidecarKey = filename;
    if (sidecar[sidecarKey] === currentHash) continue;

    // ── process this image ──
    // Strip extension; also strip a preceding .webp if present (e.g. "foo.webp.png" → "foo")
    let nameWithoutExt = basename(filename, ext);
    if (nameWithoutExt.toLowerCase().endsWith(".webp")) {
      nameWithoutExt = nameWithoutExt.slice(0, -5);
    }
    const destFilename = join(dirname(filename), `${nameWithoutExt}.webp`);
    const destPath = join(imagesDir, destFilename);

    process.stdout.write(`  img  ${filename}`);

    try {
      const pipeline = sharp(filePath).webp({ quality: WEBP_QUALITY });

      // Only resize if image exceeds max dimension
      const meta = await sharp(filePath).metadata();
      const needsResize =
        (meta.width && meta.width > MAX_DIMENSION) ||
        (meta.height && meta.height > MAX_DIMENSION);
      if (needsResize) {
        pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      await pipeline.toFile(destPath + ".tmp");

      // If converting from a non-webp format, delete the original and rename
      if (!isAlreadyWebp) {
        unlinkSync(filePath);
        // rename .tmp → final dest
        const { renameSync } = await import("node:fs");
        renameSync(destPath + ".tmp", destPath);

        // Update .md references: ./images/foo.png → ./images/foo.webp
        // Also handles bare images/foo.png and quoted variants
        const escapedFilename = filename.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        );
        const refRegex = new RegExp(
          `(images/)${escapedFilename}`,
          "g",
        );
        const newMd = mdContent.replace(refRegex, `$1${destFilename}`);
        if (newMd !== mdContent) {
          mdContent = newMd;
          mdChanged = true;
        }

        // Update sidecar key to new filename (webp)
        delete sidecar[sidecarKey];
        sidecar[destFilename] = fileHash(destPath);
        console.log(`  →  ${destFilename}`);
      } else {
        // Already webp — just overwrite in-place
        const { renameSync } = await import("node:fs");
        renameSync(destPath + ".tmp", destPath);
        sidecar[sidecarKey] = fileHash(destPath);
        console.log(needsResize ? "  [resized]" : "  [recompressed]");
      }
    } catch (err) {
      // Remove temp file if it exists
      if (existsSync(destPath + ".tmp")) {
        try { unlinkSync(destPath + ".tmp"); } catch {}
      }
      console.log(`  [FAILED: ${err.message}]`);
    }
  }

  // Persist .md if references changed
  if (mdChanged) {
    writeFileSync(mdPath, mdContent, "utf8");
    console.log(`  updated  ${presPath}`);
  }

  // Persist sidecar
  writeFileSync(sidecarPath, JSON.stringify(sidecar, null, 2));
}

// ── source-hash cache ───────────────────────────────────────
const CACHE_FILE = resolve(DOCS, ".build-cache.json");

function hashPresentation(presPath) {
  const hash = createHash("sha256");
  const mdAbs = resolve(ROOT, presPath);
  hash.update(readFileSync(mdAbs));
  const imagesDir = resolve(ROOT, dirname(presPath), "images");
  if (existsSync(imagesDir)) {
    for (const f of listFiles(imagesDir).sort()) {
      const fp = join(imagesDir, f);
      hash.update(f);
      hash.update(readFileSync(fp));
    }
  }
  return hash.digest("hex");
}

mkdirSync(DOCS, { recursive: true });

let cache = {};
if (existsSync(CACHE_FILE)) {
  try {
    cache = JSON.parse(readFileSync(CACHE_FILE, "utf8"));
  } catch {
    /* ignore */
  }
}

function saveCache() {
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

// ── main loop ───────────────────────────────────────────────
for (const pres of toBuild) {
  const relDir = dirname(pres.path); // e.g. courses/emerging-tech/s26/w01-…
  const outDir = resolve(DOCS, relDir); // absolute → works with slidev --out
  const presBase = BASE + relDir + "/"; // e.g. /my-slides/courses/.../

  console.log(`\n▸ ${pres.title}`);

  // 1. Optimise images first (idempotent, tracks its own sidecar)
  await optimizeImages(pres.path);

  // 2. Check source hash (computed after optimisation so the hash reflects
  //    the post-optimisation state of the .md and images/)
  const currentHash = hashPresentation(pres.path);
  if (!forceRebuild && cache[pres.path] === currentHash) {
    console.log(`  [skipped — up to date]`);
    continue;
  }

  console.log(`  base  ${presBase}`);
  console.log(`  out   docs/${relDir}/\n`);

  // Remove stale output so old images/assets don't linger after optimization
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });

  execSync(
    `${PNPM} slidev build "${pres.path}" --base "${presBase}" --out "${outDir}"`,
    { cwd: ROOT, stdio: "inherit" },
  );

  cache[pres.path] = currentHash;
  saveCache();
}

// ── always regenerate index + 404 from the full manifest ───
writeFileSync(resolve(DOCS, "index.html"), indexPage());
writeFileSync(resolve(DOCS, "404.html"), notFoundPage());
writeFileSync(resolve(DOCS, ".nojekyll"), "");
console.log("\n✓ docs/ is ready – commit and push to deploy\n");

// ── HTML helpers ────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slug(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
    const coursePresentation = Object.values(semesters)[0][0];
    const courseSlug = coursePresentation.path.split("/")[1] || slug(course);
    const courseId = `course-${courseSlug}`;
    let tabs = "";
    let panels = "";
    for (const [sem, list] of Object.entries(semesters).sort().reverse()) {
      const semesterSlug = slug(sem);
      const tabId = `${courseId}-tab-${semesterSlug}`;
      const panelId = `${courseId}-panel-${semesterSlug}`;
      const links = list
        .map((p) => {
          const href = esc(BASE + dirname(p.path) + "/");
          return `          <li><a href="${href}">${esc(p.title)}</a></li>`;
        })
        .join("\n");

      tabs += `        <button class="semester-tab" id="${tabId}" type="button" role="tab" aria-controls="${panelId}" aria-selected="false" data-semester="${semesterSlug}">${esc(sem)}</button>\n`;
      panels += `      <div class="semester-panel" id="${panelId}" role="tabpanel" aria-labelledby="${tabId}">\n        <ul>\n${links}\n        </ul>\n        <button class="copy-url" type="button" data-semester="${semesterSlug}" aria-live="polite">Copy URL</button>\n      </div>\n`;
    }
    sections += `  <section class="course" data-course="${courseSlug}">\n    <h2>\n      <button class="course-toggle" type="button" aria-expanded="false" aria-controls="${courseId}-content">\n        <span>${esc(course)}</span>\n        <span class="disclosure" aria-hidden="true">+</span>\n      </button>\n    </h2>\n    <div class="course-panel" id="${courseId}-content" hidden>\n      <div class="semester-tabs" role="tablist" aria-label="${esc(course)} semesters">\n${tabs}      </div>\n${panels}    </div>\n  </section>\n`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Slides — Shabtai Pinchevsky</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 720px;
      margin: 0 auto;
      padding: 3.5rem 1.5rem;
      color: #1e293b;
      line-height: 1.6;
    }
    header { margin-bottom: 2.5rem; }
    h1 { font-size: 1.75rem; font-weight: 700; margin: 0; }
    .subtitle {
      color: #64748b;
      font-size: 0.95rem;
      font-weight: 400;
      line-height: 1.45;
      margin: 0.35rem 0 0;
    }
    .course { border-top: 1px solid #e2e8f0; }
    .course:last-of-type { border-bottom: 1px solid #e2e8f0; }
    h2 { margin: 0; }
    .course-toggle {
      align-items: center;
      appearance: none;
      background: transparent;
      border: 0;
      color: #334155;
      cursor: pointer;
      display: flex;
      font: inherit;
      font-size: 1.15rem;
      font-weight: 600;
      justify-content: space-between;
      padding: 1rem 0;
      text-align: left;
      width: 100%;
    }
    .course-toggle:hover { color: #2563eb; }
    .disclosure { color: #94a3b8; font-size: 1.35rem; font-weight: 400; }
    .course-panel { padding: 0 0 1.5rem; }
    .semester-tabs {
      display: flex;
      gap: 1.25rem;
      margin: 0.1rem 0 0.75rem;
    }
    .semester-tab {
      appearance: none;
      background: transparent;
      border: 0;
      color: #94a3b8;
      cursor: pointer;
      font: inherit;
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.07em;
      padding: 0;
      text-transform: uppercase;
    }
    .semester-tab:hover,
    .semester-tab[aria-selected="true"] { color: #334155; }
    .course-toggle:focus-visible,
    .semester-tab:focus-visible,
    .copy-url:focus-visible,
    a:focus-visible { outline: 2px solid #2563eb; outline-offset: 3px; }
    .semester-panel[hidden],
    .course-panel[hidden] { display: none; }
    ul { list-style: none; padding: 0; margin: 0; }
    li { margin: 0.3rem 0; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .copy-url {
      appearance: none;
      background: transparent;
      border: 0;
      color: #94a3b8;
      cursor: pointer;
      font: inherit;
      font-size: 0.75rem;
      margin-top: 1rem;
      padding: 0;
    }
    .copy-url:hover { color: #334155; }
    @media (max-width: 480px) {
      body { padding: 2.5rem 1.25rem; }
      header { margin-bottom: 2rem; }
    }
  </style>
</head>
<body>
  <header>
    <h1>My Slides</h1>
    <p class="subtitle">Shabtai Pinchevsky, Assistant Professor of Photography, Parsons School of Design, The New School</p>
  </header>
${sections}
  <script>
    (() => {
      const courses = [...document.querySelectorAll('[data-course]')];

      function updateUrl(course, semester) {
        const url = new URL(window.location.href);
        if (course) url.searchParams.set('course', course.dataset.course);
        else url.searchParams.delete('course');
        if (semester) url.searchParams.set('semester', semester);
        else url.searchParams.delete('semester');
        history.pushState({}, '', url);
      }

      function selectSemester(course, requestedSemester, syncUrl = false) {
        const tabs = [...course.querySelectorAll('[role="tab"]')];
        const selected = tabs.find((tab) => tab.dataset.semester === requestedSemester) || tabs[0];
        if (!selected) return;

        for (const tab of tabs) {
          const isSelected = tab === selected;
          tab.setAttribute('aria-selected', String(isSelected));
          tab.tabIndex = isSelected ? 0 : -1;
          document.getElementById(tab.getAttribute('aria-controls')).hidden = !isSelected;
        }

        if (syncUrl) updateUrl(course, selected.dataset.semester);
      }

      function setOpenCourse(course, requestedSemester, syncUrl = false) {
        for (const item of courses) {
          const isOpen = item === course;
          const toggle = item.querySelector('.course-toggle');
          toggle.setAttribute('aria-expanded', String(isOpen));
          toggle.querySelector('.disclosure').textContent = isOpen ? '−' : '+';
          document.getElementById(toggle.getAttribute('aria-controls')).hidden = !isOpen;
        }

        selectSemester(course, requestedSemester, false);
        const selected = course.querySelector('[role="tab"][aria-selected="true"]');
        if (syncUrl) updateUrl(course, selected?.dataset.semester);
      }

      function closeCourses(syncUrl = false) {
        for (const course of courses) {
          const toggle = course.querySelector('.course-toggle');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.querySelector('.disclosure').textContent = '+';
          document.getElementById(toggle.getAttribute('aria-controls')).hidden = true;
        }
        if (syncUrl) updateUrl(null, null);
      }

      for (const course of courses) {
        const toggle = course.querySelector('.course-toggle');
        toggle.addEventListener('click', () => {
          if (toggle.getAttribute('aria-expanded') === 'true') {
            closeCourses(true);
            return;
          }
          const selected = course.querySelector('[role="tab"][aria-selected="true"]');
          setOpenCourse(course, selected?.dataset.semester, true);
        });

        const tabs = [...course.querySelectorAll('[role="tab"]')];
        for (const [index, tab] of tabs.entries()) {
          tab.addEventListener('click', () => selectSemester(course, tab.dataset.semester, true));
          tab.addEventListener('keydown', (event) => {
            let nextIndex;
            if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
            if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
            if (event.key === 'Home') nextIndex = 0;
            if (event.key === 'End') nextIndex = tabs.length - 1;
            if (nextIndex === undefined) return;
            event.preventDefault();
            const nextTab = tabs[nextIndex];
            selectSemester(course, nextTab.dataset.semester, true);
            nextTab.focus();
          });
        }

        for (const button of course.querySelectorAll('.copy-url')) {
          button.addEventListener('click', async () => {
            const url = new URL(window.location.href);
            url.searchParams.set('course', course.dataset.course);
            url.searchParams.set('semester', button.dataset.semester);

            try {
              await navigator.clipboard.writeText(url.toString());
            } catch {
              const textarea = document.createElement('textarea');
              textarea.value = url.toString();
              textarea.style.position = 'fixed';
              textarea.style.opacity = '0';
              document.body.append(textarea);
              textarea.select();
              document.execCommand('copy');
              textarea.remove();
            }

            button.textContent = 'Copied';
            window.setTimeout(() => { button.textContent = 'Copy URL'; }, 1600);
          });
        }
      }

      function applyUrlState() {
        const params = new URLSearchParams(window.location.search);
        const requestedCourse = (params.get('course') || '').toLowerCase();
        const requestedSemester = (params.get('semester') || '').toLowerCase();
        const course = courses.find((item) => item.dataset.course === requestedCourse) || courses[0];
        if (course) setOpenCourse(course, requestedSemester, false);
      }

      window.addEventListener('popstate', applyUrlState);
      applyUrlState();
    })();
  </script>
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
