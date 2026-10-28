# Desktop editor checkpoint — 2026-10-18

## Product direction

Markdown remains the source of truth. The native app provides a Figma-like library, navigation, real Slidev preview and parametric inspector. Content is edited in a dedicated field. Layout components plus companion `.editor.json` files should become usable without recompiling the app. Asset import/naming, build/export/publish controls and an integrated project terminal are later milestones.

Read `AGENTS.md`, `CLAUDE.md`, `planning/desktop-editor.md`, `editor/README.md` and `editor/native/VERIFICATION.md` before continuing. Use pnpm; do not add test dependencies/frameworks or edit generated `docs/` HTML.

## Implemented

- GPUI Kit + Wry native shell and real Slidev WebView; actual resizing, focus and rendering checked.
- Sidebar navigation uses Slidev's embedded `navigate` message. It no longer reloads the WebView. Repeated switching produced just the initial document request.
- Metadata-driven fields for all six shared layouts; Content and speaker notes remain separate.
- Per-slide in-memory drafts, explicit Save/Cmd+S, existing asset picker, exact saved-change undo/redo, conflict rejection, guarded close/reload.
- Targeted Markdown/YAML range patches preserve unrelated keys, comments, neighboring slides and line endings. No-op edits checked across 791 slides in 14 registered decks.
- Runtime layout picker follows Slidev's resolved component map. Component/metadata watching refreshes it; externally adding a local layout and metadata made it selectable without restart. Malformed metadata retains drafts and blocks saving that layout until repaired.
- Presentation library grouped by course and semester, search, fresh manifest on opening Library, same-window deck switching and draft-discard confirmation.
- Per-deck Node workers isolate Slidev's module-scoped cached project roots. Opening a new deck succeeds before the old session is closed. Failed opens preserve the active session. Worker source edits use internal messages, not an HTTP edit API.

## Run and verify

`pnpm editor:dev` starts at the library. `pnpm editor:dev "w01-exposure"` opens a deck directly. Close/restart an older running development app to pick up new binaries. Do not interrupt a user's existing session or discard its drafts.

The latest Rust build and JS syntax checks passed. Temporary native fixtures verified library search, switching between history/hash-router decks, rendered reports, retained drafts, Keep editing, and confirmed discard-and-switch. Both temporary deck files were byte-identical afterward; the fixture window/server/workers were cleaned up.

No deployment build, publishing, dependency additions to JavaScript, or Git commit was made. Rust dependencies are pinned in `editor/native/Cargo.lock`; target output is ignored. All implementation is currently uncommitted. A separate one-line `scale: 100` change exists in `courses/core-lab-1/f26/w01-exposure/w01-exposure.md`; leave it intact and review provenance before including it in any future commit.

## Main code

- `editor/dev.mjs`: launcher, bundle, native JSON lines and lifecycle.
- `editor/workspace.mjs`: worker startup, deck switching, manifest library and cleanup.
- `editor/deck-worker.mjs`: isolated Slidev/session/watcher integration.
- `editor/deck.mjs`: targeted source patches, snapshots, revision checks and history.
- `editor/project.mjs`: manifest/shared schema discovery and runtime metadata validation.
- `editor/preview.mjs`: API-hosted Slidev with the required `loadData` HMR callback.
- `editor/native/src/main.rs`: native shell, library/picker, preview IPC, confirmation and request handling.
- `editor/native/src/inspector.rs`: field controls and draft values.

## Next bounded milestone

Slide insertion/duplication/reordering with undo, then cached thumbnails. Start by reviewing Slidev source ranges and the history mechanism rather than introducing a second serialization format. Keep unfamiliar source intact. Other open items: library covers/recent history/deck tabs, persistent draft recovery, comprehensive keyboard-only accessibility, generic arbitrary frontmatter and named slots.

The app remains a development prototype. Automated native screenshots sometimes showed stale GPU frames despite current accessibility state and successful source writes; do not treat those captures as proof of final appearance. Native CUA can also pause unexpectedly: use bounded calls and record gaps. Signing/notarization, bundled runtimes and distribution remain later work.
