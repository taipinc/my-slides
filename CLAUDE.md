# Claude Code Instructions

This is a multi-presentation Slidev project for teaching materials. Here's what you need to know:

## Project Overview

- **Framework**: Slidev - Markdown-based presentation framework for developers
- **Purpose**: Teaching slides organized by course → semester → week
- **Deployment**: GitHub Pages serving from `docs/` directory
- **Build System**: Custom multi-presentation build pipeline

## Key Files & Directories

- **`presentations.json`**: The source of truth for all presentations
  - Lists all presentations with metadata (title, course, semester, path)
  - Must be updated when adding new presentations
  - Used to generate index page navigation

- **`courses/`**: All presentation source files
  - Organized as: `courses/[course-name]/[semester]/[week-topic]/slides.md`
  - Each presentation is a standalone Slidev markdown file

- **`scripts/build-presentations.mjs`**: Main build script
  - Builds all presentations listed in manifest
  - Supports filtering with CLI argument
  - Generates index page grouped by course/semester
  - Outputs everything to `docs/` for GitHub Pages

- **`docs/`**: Build output (committed to repo)
  - Contains all built presentations
  - Includes generated index.html and 404.html
  - Served by GitHub Pages

## Common Tasks

### Adding a New Presentation

1. Create the presentation file:
   ```
   courses/[course]/[semester]/[week-topic]/[topic].md
   ```

2. Add entry to `presentations.json`:
   ```json
   {
     "path": "courses/course/s26/w03-topic/w03-topic.md",
     "title": "Week 3: Topic Name",
     "course": "Course Name",
     "semester": "S26"
   }
   ```

3. Build and commit:
   ```bash
   pnpm build-all
   git add docs/ presentations.json courses/
   git commit -m "Add Week 3 presentation"
   ```

### Building Presentations

- **Build everything**: `pnpm build-all`
- **Build filtered**: `pnpm build-all "week 2"` or `pnpm build-all "emerging"`
- The script searches both title and path for matches

### Development Workflow

- To work on a presentation, navigate to its directory
- Use `pnpm dev` to start live preview
- Edit the markdown file to see changes
- Run `pnpm build-all` when ready to deploy

## Important Notes

- Always update `presentations.json` when adding/removing presentations
- The `docs/` directory should be committed (it's the deployment artifact)
- Each presentation builds independently with its own base path
- The index page is auto-generated from the manifest
- Use consistent naming: `wNN-topic-name/wNN-topic-name.md`

## Build Script Behavior

The `build-presentations.mjs` script:
1. Reads `presentations.json` manifest
2. Optionally filters by CLI argument (searches title + path)
3. For each presentation:
   - Runs `slidev build` with correct base path
   - Outputs to `docs/[presentation-path]/`
4. Generates `docs/index.html` with navigation grouped by course/semester
5. Generates `docs/404.html` for GitHub Pages

## Dependencies

- Slidev CLI and themes
- Node.js for build scripts
- pnpm for package management

## When Working on This Project

- Check `presentations.json` to understand what presentations exist
- Look in `courses/` to find actual presentation files
- Remember that `docs/` is generated - don't edit HTML files there directly
- Use the build-all script consistently for deployments
- Maintain the course/semester/week directory structure
