# Project Context: My Slides

## Overview
This project is a [Slidev](https://sli.dev/) presentation deck. Slidev allows for creating developer-friendly, interactive presentations using Markdown and Vue components. This repository appears to be structured to host teaching materials, specifically organized by courses (e.g., `emerging-tech`).

## Key Technologies
- **Slidev:** The core presentation framework.
- **Vue.js:** Used for interactive components within slides.
- **Markdown:** The primary format for writing content.
- **pnpm:** The package manager used for this project.
- **Netlify/Vercel:** Configuration files (`netlify.toml`, `vercel.json`) indicate readiness for deployment to these platforms.

## Directory Structure
- **`components/`**: Custom Vue components available for use in slides (e.g., `Counter.vue`).
- **`courses/`**: Contains the main content, organized by course (e.g., `emerging-tech/`).
    - `slides.md`: The entry point for a specific presentation deck.
    - `s26/`: Likely semester-specific content (Spring 2026).
- **`pages/`**: Reusable slide fragments or imported markdown files (e.g., `imported-slides.md`).
- **`snippets/`**: Code snippets referenced in the slides (e.g., `external.ts`).
- **`public/`**: (Implied) Static assets if present.

## Building and Running

### Prerequisites
- Node.js (v20+ recommended based on `netlify.toml`).
- pnpm (package manager).

### Commands
All commands are defined in `package.json`:

- **Install Dependencies:**
  ```bash
  pnpm install
  ```

- **Start Development Server:**
  Starts the presentation in watch mode at `http://localhost:3030`.
  ```bash
  pnpm dev
  ```
  *Note: Maps to `slidev --open`.*

- **Build for Production:**
  Builds the slides as a Single Page Application (SPA) to `dist/`.
  ```bash
  pnpm build
  ```
  *Note: Maps to `slidev build`.*

- **Export:**
  Export slides to PDF or PNG (requires Playwright/Chromium).
  ```bash
  pnpm export
  ```

## Development Conventions
- **Slide Content:** Written in Markdown. Use `---` to separate slides.
- **Frontmatter:** Use YAML frontmatter at the start of `slides.md` files to configure themes, titles, and layout.
- **Components:** Place Vue components in `components/`. They are auto-imported and can be used directly in Markdown (e.g., `<Counter />`).
- **Styling:** Slidev uses UnoCSS (atomic CSS) by default. Classes can be applied directly in Markdown.
- **Imports:** Slides can import other markdown files using the `src` frontmatter key (e.g., `src: ./pages/imported-slides.md`).
