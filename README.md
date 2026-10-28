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

The macOS editor prototype can be started with `pnpm editor:dev`. It opens an existing deck in a native GPUI window with a Slidev preview and an inspector with explicit Save and undo/redo for saved changes. See [editor setup and limitations](editor/README.md).

- `pnpm dev` - Start development server for root slides.md
- `pnpm build` - Build single presentation
- `pnpm build-all [query]` - Build all (or filtered) presentations
- `pnpm export` - Export slides to PDF

## Typing responses during a presentation

Use the shared addon's `question-input` layout for a left-aligned question with a wide,
multiline response area below it:

```md
---
layout: question-input
placeholder: 'What do we think?'
---

# What makes a process an algorithm?
```

Or place the reusable component in any layout:

```md
# Share your observations

<PresentationInput :rows="6" placeholder="Type our observations…" />
```

Click the field and type, using Enter for new lines. Press Escape to leave the
field and resume slide keyboard shortcuts. You can edit or select and delete text
normally. Each field keeps its own responses while navigating the deck. Reloading
or closing the presentation clears them. Responses belong to the current view;
they do not sync between presenter and audience windows or other devices.

Both options are available to decks using `slidev-addon-shared`. The root demo
(`pnpm dev`) includes an example question. The component accepts `label` (its
accessible name), `placeholder`, and `rows` (default: 8); the layout accepts `label`
and `placeholder` and fills the remaining slide height with the response area.

## Two columns with a shared title

Use `two-cols-header` from the shared addon with `title`, `left`, and `right`
slots. It uses the default slide padding and two equal columns below the title.
The title slot accepts Markdown or components such as `<bold-title>` in decks
using the `basic-bold` theme:

```md
---
layout: two-cols-header
---

::title::

<bold-title>Shared title</bold-title>

::left::

Left column content.

::right::

Right column content.
```

As with `two-cols`, `class` styles both columns and `layoutClass` styles the
overall grid (for example, `layoutClass: gap-x-16` for a wider column gap).

## Learn More

- [Slidev Documentation](https://sli.dev/)
- [Slidev GitHub](https://github.com/slidevjs/slidev)
