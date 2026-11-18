# Likhara Studio

Local-first visual React & HTML UI builder with semantic component attributes, multi-project IndexedDB persistence, transaction-aware undo/redo, and validated React Tailwind / React Inline / Standalone HTML exports.

## Development Setup

```bash
npm install
npm run dev
```

## Build, Typecheck & Tests

```bash
npm run typecheck   # tsc --noEmit
npm run build       # tsc --noEmit && vite build
npm test -- --run   # Vitest unit + jsdom integration suite (8 files, 54 tests)
```

## Headless Chromium Browser Verification (Termux / Android)

```bash
npx vite preview --port 4173 --host 127.0.0.1 &
node scripts/design-verify.mjs http://127.0.0.1:4173/
node scripts/qa-verify.mjs http://127.0.0.1:4173/
```

Both scripts drive the locally installed `/data/data/com.termux/files/usr/bin/chromium-browser` via Chrome DevTools Protocol (CDP) without downloading an external Playwright browser binary.

## Local Storage, Backup & Recovery

- **Project documents:** stored in browser `IndexedDB` (`likhara_studio` / `projects` object store, keyed by `id`).
- **Preferences:** `localStorage` stores only `likhara_active_project` and the one-time legacy migration marker `likhara_legacy_migration_v1_done`.
- **Legacy migration:** automatically migrates existing `likhara_studio_v1_project` and `canvix_studio_v4_workspace` keys on first launch without deleting or overwriting originals.
- **Backup & Restore:** use **Export** on any Project Home card (or **Save JSON** in the editor) to download a versioned `.json` project file (`schemaVersion: 1`). Restore anytime via **Import Project** on Home or **Import JSON** in the editor. Invalid JSON or unsafe schemas are rejected before modifying stored data.

## Current Limitations

- **Touch HTML5 drag-and-drop:** native HTML5 drag-and-drop is unreliable on Android WebView/touch browsers. Use the **Quick-Insert Placement** (`inside` / `before` / `after`) buttons in Components, the Layer tree's **Move Up / Move Down** buttons, or the **Parent Container (Move / Reparent)** selector in the Inspector's Semantics & Props tab as touch- and keyboard-accessible alternatives.
- **Local image uploads:** limited to `<= 512 KB` PNG/JPEG/WebP/GIF/SVG files stored in IndexedDB-backed project state.
- **Server-side form submission:** standalone HTML and preview mode perform client-side validation only unless a valid `formAction` endpoint URL is configured.
- **Tailwind CDN in standalone HTML:** exported `.html` files include the Tailwind Play CDN script for utility classes alongside inline style fallbacks.
