# Native prototype verification

Date: 2026-10-18. Development prototype, not a packaged application release.

## Environment and versions

- macOS 26.7.1, Xcode developer directory `/Applications/Xcode.app/Contents/Developer`.
- Rust 1.98.1, Cargo 1.98.1, pnpm 12.11.2.
- Existing Slidev 52.11.3 and Node 24.21.0.
- GPUI Kit 0.7.3, gpui-wry 0.7.3, lb-wry 0.53.3, GPUI snapshot 0.3.9.
- Native dependency resolution is recorded in `Cargo.lock`.

## Observed results

- Native compilation and linking succeeded on this machine.
- The existing Digital Images deck loaded with 26 slides. Photographic Exposure loaded with 25 slides, using its existing `basic-bold` theme and shared addon. These are existing source settings, not changes to the repository's authoring conventions.
- The native screenshot showed a local image and its formatted Markdown caption rendered by Slidev, with the matching `image-caption` properties and body text in the inspector.
- Preview reported 920 × 613 and 1280 × 853 rendered bounds at different window sizes: 3:2 within pixel rounding. The native window's zoom action resized the preview correctly.
- Clicking Content, selecting all, typing temporary text and pressing Left/Right kept typing in the native text field. The rendered slide remained unchanged. Clicking a WebView navigation control activated it; Right then advanced the deck and updated the native inspector. Returning to Content stopped slide-navigation shortcuts.
- About prototype hid the native WebView and displayed GPUI application content in the preview area. Returning restored the preview.
- Closing the native window ended the launcher with exit code 0 and closed its server. Ctrl+C stopped preview-only and native sessions.

## Scope and limitations

The initial editing workflow is implemented and verified below. This is not a final visual design or proof of every Slidev feature.

- The navigation panel uses text cards rather than cached slide thumbnails.
- All six shared layouts have metadata-driven properties. The picker includes project/theme/addon layouts; layouts without metadata support body/notes. Imported slides remain read-only.
- The WebView keeps its own native focus behavior. Mouse switching and text-entry behavior have been checked; a complete keyboard-only focus cycle and assistive-technology pass remain open.
- The overlay strategy temporarily replaces the preview. Compositing floating native panels over a visible WebView is not implemented.
- Fonts follow the existing deck and Slidev configuration; a separate offline font-packaging check has not been done.
- Layouts and metadata refresh while running. Source files can be reloaded explicitly; conflicting saves retain the draft and reject the write. Automatic merging remains later work.
- Timeout/error UI exists; rendering-error recovery was checked below. The 45-second initial-load timeout and offline network recovery have not been exercised separately.
- This development app uses installed Node/pnpm and Cargo. Bundled runtimes, signing, notarization and distribution remain out of scope.

## Final recovery checks

- Retry on an already-rendered real Slidev slide produced another rendered report for the same slide, confirming a full reload rather than a no-op navigation.
- An isolated temporary localhost fixture first supplied a rendering-error element. The native app hid its WebView and showed a readable error message. Clicking Retry reloaded the fixture, which returned valid content; the WebView became visible again and reported 600 × 400 rendered bounds. This verified the recovery mechanism without changing any presentation.
- An unmatched deck filter failed cleanly before starting a server/window.
- `git diff` confirmed no changes to `courses/`, `docs/`, `presentations.json` or `pnpm-lock.yaml` after native verification.

## Navigation and initial source editing

- Sidebar selection now sends Slidev's own embedded navigation message instead of changing `location`. A temporary verification server counted one initial HTML document request while switching between slides repeatedly. The inspector and preview stayed synchronized without page reloads. Selecting the current slide also preserves its draft.
- Read-only verification against all registered Markdown sources confirmed byte-identical no-op edits for 791 slides across 14 decks.
- Fourteen temporary source variants covered LF/CRLF, empty bodies, final speaker notes, fenced YAML, fenced code containing slide separators, unknown fields, inline comments and missing frontmatter. Changed regions parsed back to the intended body, notes and field values.
- A temporary deck session verified that unchanged Save writes nothing, scalar changes retain inline comments and unknown keys, neighboring slides survive, file permissions survive, and undo/redo restores exact bytes. An external edit was rejected, and an asset outside the deck's images directory was rejected.
- Native verification used a separate temporary Slidev project with generated SVG assets. Editing a caption, scale, border and notes, switching away/back, and Save retained the draft and wrote the intended Markdown. The Slidev preview displayed the changed caption, image scale and border.
- The native file picker assigned an existing SVG as a `./images/...` reference. Save updated the displayed image. Cmd+S from Content saved a separate edit.
- Undo save and Redo save restored the prior/current values in the inspector and source. The temporary project was restored to its original bytes before cleanup.
- Changing the temporary deck externally caused Save to display a readable conflict message while retaining the native draft; the external file was not overwritten.
- Closing with a draft presented Keep editing/Discard drafts and close. Cancelling retained the draft. Reload from disk presented a separate discard confirmation; confirming loaded the external source and cleared drafts/history.
- The API-hosted Slidev server now supplies its `loadData` callback, matching the installed CLI's HMR integration. Body edits hot-update; changes to deck headmatter configuration may cause Slidev to reload its preview.
- The development bundle now installs rebuilt executables through a fresh file and atomic rename. This avoids reusing the inode of an executable with cached macOS code-signature state, which caused intermittent killed relaunches during development.
- No JavaScript dependencies, test framework, test scripts, deployment builds or course-source changes were added by this verification.

## Extensible layouts

- All six shared companion schemas validate. Runtime discovery uses Slidev’s resolved layout map, including theme and project-local components.
- Temporary backend checks switched layouts while retaining unknown frontmatter, restored exact bytes with undo, and rejected malformed metadata.
- In a separate temporary native project, choosing `center` retained content and notes, then Save wrote the selected layout and retained content.
- Adding `layouts/aaa-fresh.vue` and its metadata externally refreshed the running native picker from 29 to 30 layouts. The new label appeared without restarting or recompiling; selecting it exposed its Background field, retained Content/notes, and Save wrote its layout ID while preserving existing unrelated fields.
- Automated native screenshots intermittently showed stale GPU frames during the second verification session; accessibility state and source writes were used for the live-discovery checks. A fresh foreground visual pass remains useful for final appearance.

## Library and isolated deck switching

- The native library displays registered decks grouped by course/semester. Search filtered two temporary decks to the matching title; returning to the library retained the search.
- Selecting a second deck switched the sidebar and inspector to its title/content in the same window. The new hash-router preview reported rendered 920 × 613 bounds.
- A temporary unsaved draft survived opening the library. Selecting another deck prompted before discarding it; Keep editing retained the draft.
- Backend checks used decks in different directories. Unregistered paths and a deliberately missing addon were rejected without replacing the active session. Successful switches closed the previous worker, changed router modes, and ignored stale layout events.
- Slidev caches roots at module scope. Separate Node workers isolate each deck’s roots, toolchain state, asset resolution and preview lifecycle. The native IPC handler stamps preview messages with their origin and drops reports from a previous origin.
- The library has no cover thumbnails, persisted recent history, deck tabs or new-deck creation yet. Worker startup has a 60-second timeout; shutdown allows three seconds for graceful Vite cleanup before terminating the worker.
