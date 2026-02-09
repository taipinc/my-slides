# Teaching Presentations

A multi-presentation [Slidev](https://sli.dev/) project for creating and managing course slide decks.

## Project Structure

```
my-slides/
├── courses/                    # All course presentations
│   └── [course]/[semester]/[week]/[slides.md]
├── presentations.json          # Manifest of all presentations
├── scripts/
│   └── build-presentations.mjs # Build script for all presentations
└── docs/                       # Built output (GitHub Pages)
```

## Quick Start

### Development

To work on a specific presentation:

```bash
pnpm install
pnpm dev
# Edit slides.md to see live changes at http://localhost:3030
```

### Building Presentations

The `build-all` script builds presentations listed in `presentations.json`:

```bash
# Build all presentations
pnpm build-all

# Build only presentations matching a query (searches title and path)
pnpm build-all "week 2"
pnpm build-all "emerging"
```

Output goes to `docs/` directory, ready for GitHub Pages deployment.

## Adding a New Presentation

1. **Create the presentation directory and slides**:
   ```
   courses/[course]/[semester]/[week-topic]/slides.md
   ```

2. **Add entry to `presentations.json`**:
   ```json
   {
     "path": "courses/[course]/[semester]/[week-topic]/slides.md",
     "title": "Week N: Topic Name",
     "course": "Course Name",
     "semester": "S26"
   }
   ```

3. **Build and deploy**:
   ```bash
   pnpm build-all
   git add docs/ presentations.json
   git commit -m "Add Week N presentation"
   git push
   ```

## How the Build System Works

- **`presentations.json`**: Central manifest defining all presentations
  - `base`: Base URL path for GitHub Pages
  - `presentations`: Array of presentation metadata

- **`build-all` script**:
  - Reads `presentations.json`
  - Builds each presentation with Slidev
  - Outputs to `docs/[presentation-path]/`
  - Generates `docs/index.html` with grouped navigation (by course → semester)
  - Generates `docs/404.html` for GitHub Pages

- **GitHub Pages**: Serves the `docs/` directory
  - Main index at the base URL shows all presentations
  - Each presentation is a separate Slidev build

## Available Scripts

- `pnpm dev` - Start development server for root slides.md
- `pnpm build` - Build single presentation
- `pnpm build-all [query]` - Build all (or filtered) presentations
- `pnpm export` - Export slides to PDF

## Learn More

- [Slidev Documentation](https://sli.dev/)
- [Slidev GitHub](https://github.com/slidevjs/slidev)
