# Desktop editor prototype

This directory contains a macOS GPUI/Slidev editor prototype and project discovery. The [implementation plan](../planning/desktop-editor.md) describes subsequent milestones.

## Run the native prototype

Prerequisites: macOS 15+, Rust/Cargo, Xcode Command Line Tools, pnpm and the project's installed Node dependencies. The first Cargo build downloads and compiles native dependencies. Cargo is used only for the Rust app; pnpm remains the JavaScript package manager.

```bash
pnpm editor:dev
pnpm editor:dev "w01-exposure"
pnpm editor:dev --preview-only "w01-exposure"
```

The optional filter must match exactly one presentation title/path. With no filter, the app starts on the presentation library, with Photographic Exposure available as the initial deck. A filtered launch opens that deck directly and initially requests its first `image-caption` slide. It compiles the native app, starts Slidev on loopback, writes a temporary read-only project snapshot, creates a development app bundle under `editor/native/target/debug/`, and opens the window. Use the command to launch: the development bundle does not start a backend by itself.

**Library** shows registered presentations grouped by course and semester. Search matches title, course, semester and path. Opening the library refreshes the manifest; selecting a deck opens it in the same window. Unsaved drafts prompt before switching; cancelling retains them. A failed open retains the current session. Each deck gets an isolated Node worker because Slidev caches its initial project directory; replacing a deck closes its previous server and worker. Deck tabs, recent history and cover thumbnails remain future work.

The left panel selects slides through Slidev's embedded navigation API, without reloading the page. The center is the actual Slidev renderer. The right panel edits Content and speaker notes, plus properties declared in a layout's metadata. All six shared layouts expose their declared properties. Layouts without metadata expose Content and notes. Click the layout name to choose from the active deck’s resolved project, theme and addon layouts; content, notes and existing parameters survive layout changes. The preview changes after Save.

Edits are drafts until **Save** or **Cmd+S** from a native field. Drafts survive sidebar and preview navigation. Save writes the selected slide and the preview updates through Slidev's normal development-server pipeline. Changes to headmatter configuration can cause Slidev to reload the document; ordinary sidebar navigation does not. **Discard draft** resets the current slide's draft. Imported slides are read-only in this milestone.

**Undo save** and **Redo save** restore up to 50 saved changes in the current session; save or discard all pending drafts before using them. The native text fields also provide their own text-editing undo via Cmd+Z. Reloading from disk or restarting clears saved-change history. Drafts are currently in memory, not persisted across restarts; closing the window with drafts prompts before discarding them.

**Choose existing file…** uses the native file picker and accepts files already inside the presentation's sibling `images/` folder. It writes a relative `./images/...` reference. Importing new files, renaming assets, adding/reordering slides, thumbnails and publishing remain later work.

Retry preview explicitly reloads the WebView and retains drafts. About prototype and confirmation panels hide the WebView while displaying native application content, avoiding its overlay-composition restriction. A startup/rendering timeout has a visible error and retry path; terminal output retains Slidev errors. Preview messages update the selected slide and report rendered dimensions.

If a source file changed externally, Save and history operations are rejected with a readable message while retaining the draft. **Reload from disk** lets you review the external version, with confirmation before discarding drafts/history. Automatic merging is not implemented. Layout components and companion metadata are watched. Adding a layout refreshes the picker and preview after a short debounce, without rebuilding the native app. Metadata changes refresh the inspector while retaining drafts. Invalid metadata displays a diagnostic and blocks Save for that layout until repaired; missing metadata permits body/notes editing. Changes to theme, addon, canvas or router configuration also require restarting the development app.

Closing the last native window stops the application, closes its Slidev server and removes its temporary snapshot. Ctrl+C also stops the launcher and child process; development-process termination does not retain drafts. `--preview-only` starts only the local Slidev server and stops with Ctrl+C. Neither mode builds deployment output or publishes anything.

The Node session uses the installed Slidev parser to locate source slides and YAML scalar ranges, then patches only changed regions. An unchanged Save is byte-identical. Existing comments, unknown keys, neighboring slides and line-ending conventions are preserved. Unsupported YAML field structures and edits that introduce slide boundaries or reinterpret notes are rejected for source editing. Saves check file revisions, stage a same-directory temporary file, preserve file permissions and replace the source atomically. This is optimistic conflict detection, not a cross-process lock or automatic merge.

The native app exchanges versioned snapshot data and JSON-line edit requests with the Node parent over stdin/stdout. The parent routes deck operations to an isolated worker over Node’s internal message channel; no new network edit endpoint is exposed. The WebView IPC bridge reports rendering/navigation only and has no source-writing interface. No additional JavaScript dependencies or network edit API were introduced.

Native dependencies are pinned in `native/Cargo.toml`, with a committed lockfile for reproducibility. The [verification record](native/VERIFICATION.md) separates observed native results from remaining limitations.

## Inspect project metadata

From the repository root:

```bash
pnpm exec node editor/inspect-project.mjs
```

This prints JSON containing the manifest's presentations, discovered shared-addon layouts, and diagnostics. It does not start Slidev, build slides or change project files. This standalone inspection reads fresh shared-addon files on every call. The running app additionally discovers and watches layouts resolved by Slidev for the active deck.

## Initial layout metadata contract

Place `<layout-name>.editor.json` next to its Vue layout component, for example in `slidev-addon-shared/layouts/` or the presentation’s local `layouts/` directory. This companion file describes editing controls; the Vue component remains responsible for rendering. The filename determines the layout ID, avoiding a duplicate identifier inside the metadata.

```json
{
  "version": 1,
  "label": "Image with caption",
  "fields": [
    {
      "key": "image",
      "label": "Image",
      "type": "asset",
      "accept": ["image", "video"]
    },
    {
      "key": "scale",
      "label": "Scale",
      "type": "number",
      "default": 100
    }
  ],
  "content": {
    "label": "Content",
    "description": "Caption below the image",
    "format": "markdown"
  }
}
```

`fields` map directly to frontmatter keys. Supported initial types are `asset`, `number`, `boolean`, `text` and `select`. Select fields have a nonempty array of string `options`. Asset fields have an optional `accept` array containing `image`, `video` or `audio`. Defaults describe the component's behavior when the key is absent; discovery never materializes defaults into a deck. Omit a default when the Vue component does not declare one.

`content` is optional. When present, it describes the slide's existing Markdown body; it never creates a `content` or `caption` frontmatter key. Notes are edited separately and remain in the final comment block. Named slots and richer validation remain deferred.

A layout without metadata is returned with `editor: null` and supports body/notes editing. Malformed or unsupported metadata produces `editor: null`, `metadataError: true` and a diagnostic, without removing the Vue layout from discovery; Save is blocked until it is repaired. Orphan metadata files produce diagnostics in standalone shared-addon discovery.

The running editor uses Slidev’s resolved layout map, including its precedence rules, rather than scanning every directory independently. Runtime watching covers component and metadata additions, changes and removals. Layout changes preserve unedited frontmatter; obsolete parameters are retained rather than silently deleted. Generic arbitrary frontmatter controls and named-slot extensions remain future work.
