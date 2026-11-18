# Likhara Studio — Phase 0 Reconnaissance Report

**Date:** 18 November 2026
**Environment:** Android / Termux, Node v26.13.1, npm 12.2.2, git 2.56.1
**Mode:** Reconnaissance only — no product code edited, no dependencies installed, Phase 1 not started.

---

## 1. Repository map

There is no repository. The working directory contains **three loose files, no scaffold**:

```
~/projects/Likhara/
├── Likhara Studio UI Builder.txt          # 4,902 lines — the entire app in one file (React + TS source)
├── Likhara_Stage_1_...Prompts(1).md       # 1,441 lines — audit + phase prompts (Phases 0–7)
├── Likhara_Stage_2_...Roadmap(1).md       # 766 lines — roadmap (Phases 8+)
└── PHASE_0_RECONNAISSANCE_REPORT.md       # this report (pending: copy from plan dir)
```

No `package.json`, no lockfile, no `tsconfig`, no `node_modules`, **no git repo**, no `src/`.

### Source map of the txt (7 sections)

| Lines | Section | Contents |
|---|---|---|
| 67 | 1 | Domain types, recursive `UINode`, project envelope |
| 288 | 2 | Color / alpha / Tailwind token utilities |
| 600 | 3 | Pure immutable tree operations |
| 789 | 4 | Schema validator + safe serialize/deserialize |
| 1108 | 5 | Transaction-aware undo/redo engine |
| 1129 | 6 | Export compilers + diagnostics |
| 2206 | 7 | Interaction controllers, `App()` (line 2382), canvas, inspector |

### Key symbols

- `LIKHARA_PROJECT_STORAGE_KEY` = `likhara_studio_v1_project` (l.246) with **legacy Canvix migration already implemented** (l.2101–2162, `canvix_studio_v4_workspace` fallback) — the txt is *newer* than the `untitled.md` the Stage 1 audit described.
- Export compilers (l.1354–1474): `compileToReactTailwind`, `compileToReactInlineStyle`, `compileToStandaloneHTML` — 3 export targets.
- Drag/drop: native HTML5 events (l.3101–3105, palette l.3689).
- Resize: pointer-based handle (l.2719, 3090).
- JSON import: `FileReader` at l.2979; JSON export at l.2921.
- Autosave → localStorage (l.2189).

---

## 2. Existing stack and commands

**None exist.** Inferred intended stack from source: React + TypeScript, `lucide-react`, Tailwind utility classes (no CSS import in file — external setup required). Only imports: `react`, `lucide-react`.

Available tooling: Node v26.13.1, npm 12.2.2, git 2.56.1. Natural scaffold is Vite + React-TS + Tailwind — a Phase 1 prerequisite decision, not made here.

---

## 3. Baseline build/test result

**Could not run — there is nothing to build.** Installing dependencies is forbidden in Phase 0.

Static sanity only: the file is structurally complete (`App` closes at line 4902; no truncated JSX). Syntax/type validity remains unverified until `tsc`/build can run.

---

## 4. Chromium and screenshots

- **Chromium 157.0.8103.50** at `/data/data/com.termux/files/usr/bin/chromium-browser`, plus `chromedriver`. Already installed; nothing downloaded.
- Headless **works**: DOM dump succeeded (dbus/inotify stderr lines are harmless Termux noise).
- Screenshot pipeline **works**: sanity capture at
  `/data/data/com.termux/files/usr/tmp/opencode/likhara-baseline/chromium-sanity-390x844.png` (390×844, `--screenshot` flag).
- **App screenshots: not possible yet** — no runnable app exists. Real 390×844 and 1440×900 baselines will be captured immediately after the Phase 1 scaffold boots.

---

## 5. Confirmed issues vs. unverified concerns

### Confirmed from source

1. **No home/start page** — `App()` renders the editor directly; no route/view switch anywhere in the file.
2. **Single-project persistence** — one storage key holds one workspace/tree; no multi-project model.
3. **Native HTML5 drag/drop** — unreliable on touch/Android; phone-first product risk.
4. **Tailwind classes without any CSS system in-file** — depends entirely on an unbuilt scaffold.

### Unverified concerns (carried forward from Stage 1 audit)

- Export fidelity gaps (anchors/buttons/forms behavior in generated code) — the txt has an "Export Fidelity Diagnostics" panel, so partial mitigation may already exist; needs runtime verification.
- Autosave/history noise on high-frequency edits.
- Resize and nested-drop correctness on touch.
- Import safety on malformed JSON.
- Accessibility overall.

None reproduced — nothing runs yet.

---

## 6. Recommended minimal test tooling

1. **Vitest** for the pure layers — sections 3, 4, 5, 6 are pure functions (tree ops, validator, history, compilers): cheap, high-value unit tests with zero DOM.
2. **One shell script** driving `chromium-browser --headless --screenshot` for viewport baselines (already proven).
3. Nothing else. No Playwright (downloads a browser — forbidden), no Cypress, no chromedriver wiring until a flow actually needs it.

---

## 7. Phase-by-phase risk list

| Phase | Risk | Mitigation |
|---|---|---|
| **1** Home + project model | Scaffolding choices (bundler, CSS system) lock in everything after; storage migration must not destroy existing `likhara_v1`/`canvix_v4` data | Pick Vite+Tailwind once, migrate-before-write, snapshot tests on deserializer |
| **2** Design system | Restyling 4,900 lines of inline Tailwind in one pass → regressions | Rebuild shell first, editor chrome second, canvas last |
| **3** State/history/dnd | Replacing native DnD with pointer events can break desktop parity; history rewrite can corrupt undo | Keep pure tree ops as the only mutation path; unit-test history transactions before touching UI |
| **4** Component semantics | New behavior fields break old saved projects | Schema validator must default new fields; migration tests |
| **5** Exporters/import | Compiler rewrites silently change generated output | Golden-file snapshot tests of all 3 compilers before editing |
| **6** A11y/perf | Touch DnD rewrite is the biggest behavioral risk on the actual target device (Android) | Test on-device via Termux-served dev URL, not just headless |
| **7** Cleanup | Premature simplification during earlier phases | Ponytail debt ledger (`shortcut:` comments) reviewed at the end |

---

## 8. Checkpoint status

**No backup exists yet** — there is no git repo. Before Phase 1 the recommended first action is exactly one: `git init` + initial commit of the source files as the pristine checkpoint. Not run — Phase 0 stops here.

---

**Status:** Phase 0 complete. Awaiting approval to begin Phase 1.
