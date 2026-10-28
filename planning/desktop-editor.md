# Desktop slide editor

Status: native GPUI/Slidev preview and initial Markdown editing workflow implemented. See `editor/native/VERIFICATION.md` for observed results and limitations.

## Product decisions

- Markdown files and their sibling assets remain the presentation source of truth.
- Slidev and the existing Vue layouts render both previews and published slides.
- Content is edited in inspector fields, never directly on the slide preview.
- The app uses a compact, restrained interface informed by the supplied Figma screenshots: library cards, slide thumbnails, central preview, resizable inspector, subtle separators and rounded controls.
- The library groups presentations by course and semester, with year filters, search and recent decks. `presentations.json` remains the registration format, maintained by the app.
- Custom layouts have project-local editor metadata. Adding a layout and its metadata must not require recompiling the desktop app.
- Imported asset names are editable suggestions based on a title, caption or original filename. Later caption edits do not rename files. Explicit rename operations update references and resolve collisions.
- Present, Build, Export and Publish are separate actions with separate status.
- A project terminal is a later milestone. An agent interface comes after reliable external-edit handling.

## Proposed architecture

The desktop shell uses Rust, GPUI and GPUI Kit, subject to the preview feasibility check below. A local Node process integrates the existing Slidev toolchain and project files. An embedded WebView renders the real Slidev preview. Rendering layouts a second time in Rust would create a second implementation to maintain.

The Node integration owns deck parsing, targeted source edits, schema discovery, asset operations and build processes. The desktop shell owns navigation, inspector controls, undo interactions and application windows. Their versioned message interface will be defined during the prototype; no HTTP service or arbitrary command endpoint is needed in the initial discovery foundation.

Project files remain usable with pnpm and an external text editor. App-only state such as recent decks, panel sizes and cached thumbnails must not become necessary to open or build a presentation.

## Milestone 0: establish the contract

- [x] Record the product decisions and phased implementation plan.
- [x] Define an initial companion metadata format for `image-caption`.
- [x] Implement read-only manifest and shared-layout discovery without new dependencies.
- [x] Retain layouts with missing or invalid metadata as generic source-editing entries, with diagnostics for invalid metadata.
- [x] Exercise the initial schema's field types in the native inspector; named slots remain deferred.

Initial files are `editor/project.mjs`, `editor/inspect-project.mjs` and `slidev-addon-shared/layouts/image-caption.editor.json`. See `editor/README.md` for the current contract and limitations.

## Milestone 1: prove native preview integration

Build a small macOS GPUI window with a thumbnail/navigation region, a real Slidev WebView and a narrow inspector. Use an existing deck without changing it initially.

Acceptance criteria:

- The selected slide renders using its existing theme, addon, fonts and 3:2 aspect ratio.
- Resizing preserves the preview's proportions.
- Keyboard focus moves reliably between the native inspector and WebView.
- Menus and dialogs have a usable placement strategy given the WebView's overlay restrictions.
- Startup, preview errors, process shutdown and window closure behave predictably.
- Record the actual dependency versions, build instructions and native verification results.

This is the GPUI go/no-go checkpoint. Do it before building the full library, thumbnail pipeline or publishing UI. Native compilation and the primary interaction checks have now succeeded on the current machine; see `editor/native/VERIFICATION.md` for remaining coverage gaps.

References checked on 2026-10-18: [GPUI](https://gpui.rs/), [GPUI Kit setup](https://gpui-kit.com/docs/getting-started/) and [experimental WebView integration](https://gpui-kit.com/docs/webview/). The WebView documentation currently identifies focus and overlay composition as integration constraints.

## Milestone 2: one complete editing workflow

Support selecting an `image-caption` slide, assigning an existing image, editing Content, and changing scale and border through metadata-driven controls. Keep speaker notes separate from the body field. Provide explicit Save and undo/redo before adding autosave.

Acceptance criteria:

- Opening and saving an untouched presentation yields a byte-identical file.
- A field edit changes only the intended source region; unfamiliar keys, comments, custom markup and neighboring slides survive.
- Content writes to the Markdown body, not a duplicate caption property.
- Notes remain intact and separate from Content.
- Slide boundaries follow Slidev syntax, including code fences and frontmatter; avoid splitting blindly on `---`.
- Saving detects an external edit since the source snapshot and offers reconciliation instead of overwriting it.
- The preview updates after save; changing slides and undo/redo preserve the expected selection.
- Verification uses temporary deck copies and includes representative Vue/HTML, notes and reveals. No test framework or test dependencies are introduced.

Inspect the installed Slidev parser and source ranges before choosing the edit implementation. Parsing and serializing an entire Markdown/YAML document is not assumed to preserve its formatting.

Implemented: `editor/deck.mjs` patches source ranges, checks revisions and maintains session-local saved-change history. `editor/native/src/inspector.rs` implements schema-driven draft fields. The app supports explicit Save/Cmd+S, retained per-slide drafts, separate notes, existing-asset selection, Undo save/Redo save, and confirmed reload/close. Imported slides remain read-only. Automatic conflict merging, persistent draft recovery and unified cross-field unsaved undo remain later refinements.

## Milestone 3: library and extensible layouts

- [x] Add the course/semester library, search and same-window deck switching.
- Add recent presentations, cover thumbnails and deck tabs.
- Add slide insertion, duplication, reordering and deletion with undo.
- Create decks and update their manifest entries together, preserving repository conventions.
- [x] Add metadata for the remaining shared layouts and resolve layouts from the active theme/addons, not only the shared addon.
- [x] Watch component and metadata changes, refresh the picker/inspector, and invalidate previews. Preserve drafts and hidden field values when metadata is malformed; block Save until repaired.
- Provide generic frontmatter and Markdown editing for layouts without metadata.
- Support named content slots without flattening them into one body field.

Acceptance scenario: create a Vue layout and its metadata externally, return to the open app, and select the layout without restarting or rebuilding the app.

## Milestone 4: asset management

- Import into the deck's sibling `images/` directory with an editable, readable filename suggestion.
- Resolve filename collisions, detect reusable identical assets and preserve attribution separately.
- Provide explicit rename with project-wide reference analysis and a review of the changes.
- Treat ambiguous references in dynamic Vue expressions conservatively; do not promise universal safe text replacement.
- Add a reviewed cleanup workflow for existing filenames.

The current build pipeline optimizes images and can change image extensions and Markdown references. The editor must reload these changes and avoid racing a save against a build. Asset operations must also respect the existing optimization sidecar.

## Milestone 5: build, export and publish

- Wrap existing pnpm/Slidev commands with progress, cancellation and readable error output.
- Offer deck-specific builds and exports with format/destination controls supported by Slidev.
- Inspect current deployment configuration before implementing publishing.
- Track saved source, successful build and confirmed deployment separately. A successful local command alone is not proof of a live deployment.
- Show the concrete source/build changes before a publish action, including changes produced by image optimization.
- Preserve the manifest base path and generated `docs/` deployment workflow.

## Milestone 6: integrated project tools

Add a collapsible terminal rooted in the project, then evaluate a dedicated Codex interface. Agent-created files follow the same layout contract and file-change reconciliation as manual external edits. Define process lifecycle, permissions and change-review behavior before agent integration.

## Scope boundaries

The first prototype supports this repository on macOS. A general-purpose Slidev editor, application distribution, bundled Node/pnpm, multi-project configuration and a polished installer are later decisions. A development prototype may use the installed toolchain; the shipped application's dependency experience needs an explicit packaging decision.

Milestones 1 and the initial Milestone 2 workflow are runnable through `pnpm editor:dev`. Native rendering, resizing, focus, instant sidebar routing, saved editing, preview updates, undo/redo, conflict rejection and close/reload confirmation have been observed. Complete keyboard-only focus coverage remains open. Layout selection, all six shared schemas, active-theme/addon resolution and live layout discovery are also implemented. The course/semester library, manifest refresh, search, guarded deck switching and isolated per-deck workers are implemented. Next: slide insertion/duplication/reordering and thumbnails in Milestone 3.
