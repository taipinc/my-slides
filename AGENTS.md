# AGENTS.md — Coding Agent Instructions

This is a multi-presentation [Slidev](https://sli.dev) project for teaching materials.
Read this file before making any changes. Also read `CLAUDE.md` for additional context.

---

## Project Overview

- **Framework**: Slidev (Markdown-based presentations)
- **Package manager**: pnpm (always use `pnpm`, never `npm` or `yarn`)
- **Deployment**: GitHub Pages from the `docs/` directory
- **No test framework**, no linter, no formatter — none of these are installed

---

## Commands

### Build

```bash
# Build all presentations (skips unchanged ones via source-hash cache)
pnpm build-all

# Build presentations matching a filter string (searches title AND path)
pnpm build-all "emerging"
pnpm build-all "week 2"

# Force rebuild everything, ignoring the cache
pnpm build-all --force
pnpm build-all "week 2" --force

# Build only the root slides.md (rarely used)
pnpm build
```

### Development

```bash
# Start live-preview for the root slides.md
pnpm dev

# To preview a specific course presentation, navigate to its directory first
# then run slidev from there (or use the full path with slidev directly)
pnpm slidev dev courses/emerging-tech/s26/w02-artists\&procedures/w02-artists\&procedures.md
```

### Export

```bash
pnpm export    # Export root slides.md to PDF
```

### No test commands

There are no tests in this project. Do not add test-related dependencies or scripts.

---

## Repository Layout

```
presentations.json          # Source of truth — ALL presentations listed here
scripts/build-presentations.mjs  # Build pipeline script
courses/                    # All presentation source files
  [course]/[semester]/[wNN-topic]/[wNN-topic].md
docs/                       # Build output — committed to repo for GitHub Pages
slidev-addon-shared/        # Local Slidev addon (custom layouts + styles)
  layouts/                  # Custom layout .vue components
  styles/                   # Global CSS (nav position, font scaling)
  setup/                    # Vite plugin (copies images/ to build output)
components/                 # Global Vue components available in all slides
styles/custom.css           # Global style overrides
slides.md                   # Root demo/template presentation (not deployed)
```

---

## Adding a New Presentation

Follow this exact workflow — deviating breaks the build or deployment:

1. **Create the file** using the naming convention:
   ```
   courses/[course-name]/[semester]/[wNN-topic]/[wNN-topic].md
   ```
   Example: `courses/emerging-tech/s26/w04-neural-nets/w04-neural-nets.md`

2. **Place images** in a sibling `images/` directory:
   ```
   courses/emerging-tech/s26/w04-neural-nets/images/
   ```

3. **Update `presentations.json`** — this is mandatory:
   ```json
   {
     "path": "courses/emerging-tech/s26/w04-neural-nets/w04-neural-nets.md",
     "title": "Week 4: Neural Networks",
     "course": "Emerging Technologies",
     "semester": "S26"
   }
   ```

4. **Build and commit**:
   ```bash
   pnpm build-all
   git add docs/ presentations.json courses/
   git commit -m "Add Week 4 presentation"
   ```

---

## Presentation File Structure

### Required Frontmatter

Every course presentation must start with this frontmatter block:

```yaml
---
theme: apple-basic
colorSchema: light
addons:
  - ../../../slidev-addon-shared
title: Week N: Topic Name
drawings:
  persist: false
mdc: true
fonts:
  sans: Geist
aspectRatio: 3/2
canvasWidth: 1440
layout: intro
---
```

- `theme`: always `apple-basic` for course slides
- `addons`: always includes the relative path to `slidev-addon-shared`
- `canvasWidth: 1440` + `aspectRatio: 3/2` — do not change these
- `layout: intro` on the opening slide

### First Slide Template

```markdown
## PSAM 2802: Course Name

# Week N: Topic Title

<div class="absolute bottom-10">
  <span class="font-400">Week N</span>
</div>
```

---

## Custom Layouts (from slidev-addon-shared)

Use these layouts via slide frontmatter. All are provided by the local addon.

| Layout | Key Props | Use Case |
|---|---|---|
| `image-caption` | `image`, `scale` (default 100), `border` (bool) | Full image with caption below |
| `image-right` | `image`, `width` (default 50), `align` (top/center/bottom) | Text left, image right |
| `image-stack-right` | `image1`, `image2`, `image3` | Text left, up to 3 stacked images right |
| `image` | `image`, `scale` | Centered full-bleed image |
| `video-caption` | `video`, `start` (seconds) | YouTube/Vimeo embed with caption |
| `website-embed` | `url` | iframe embed with caption |

Standard Slidev layouts also available: `center`, `two-cols`, `default`, etc.

### Image paths

Always use relative paths from the slide file: `./images/filename.jpg`.
The Vite plugin in `slidev-addon-shared/setup/vite-plugins.ts` copies the `images/` directory into the build output automatically.

---

## Slide Authoring Conventions

- **Slide separator**: `---` with optional YAML frontmatter keys on the lines immediately after
- **Incremental reveals**: use `v-click` (single element) or `v-clicks` (list), `v-clicks depth="2"` for nested lists
- **Speaker notes**: `<!-- note text here -->` comment blocks at the bottom of a slide
- **MDC syntax** (`mdc: true` in frontmatter): enables `::component-name{prop=val}` shorthand
- **No transitions** defined in course slides (leave out `transition:` key)
- **`routerMode: hash`** may be used for presentations served from nested paths

---

## `presentations.json` Schema

```jsonc
{
  "base": "/my-slides/",        // GitHub Pages base path — do not change
  "presentations": [
    {
      "path": "courses/...",    // Relative path from repo root to .md file
      "title": "Week N: ...",   // Display title (used in index page)
      "course": "Course Name",  // Groups presentations on the index page
      "semester": "S26"         // Sub-groups within a course
    }
  ]
}
```

`presentations.json` is the **only** place to register a presentation. The build script reads it to determine what to build and to generate `docs/index.html`.

---

## `docs/` Directory

- **Committed to the repo** — it is the GitHub Pages deployment artifact
- **Never edit HTML files in `docs/` directly** — they are fully regenerated by `pnpm build-all`
- The index page and 404 page are always regenerated from the full manifest, even when filtering the build

---

## Code Style

Since there is no linter or formatter configured, follow the conventions already in use:

- **JavaScript** (build scripts): ES modules (`import`/`export`), no CommonJS; use `async/await`; Node.js built-ins preferred over external deps
- **Vue components** (layouts, addon): standard single-file component (`.vue`) format with `<template>`, `<script setup>`, `<style scoped>`
- **Markdown/slides**: keep frontmatter keys alphabetically ordered where possible; use 2-space indentation in YAML
- **Naming**: directories and files use kebab-case; week prefixes use zero-padded two digits (`w01`, `w02`, ...)
- **Ampersands in paths**: when a path contains `&` (e.g. `w01-computation&algorithm`), quote it in shell commands
- **No TypeScript config** exists at the repo root — the addon's `.ts` files are processed directly by Vite/Slidev

---

## Important Constraints

- Always use `pnpm` — the project uses `pnpm-lock.yaml`
- Never commit `node_modules/` or `dist/`
- Always commit `docs/` after a build that should be deployed
- Keep `presentations.json` in sync with files in `courses/` — orphaned entries or missing entries both cause problems
- The `slidev-addon-shared` addon path (`../../../slidev-addon-shared`) is relative to each presentation file — maintain the `courses/[course]/[semester]/[week]/` depth
- Do not add external dependencies without a clear reason; Slidev and its peer deps are already large
