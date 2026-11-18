# Likhara Studio — Full Technical, UX, Visual & Functional Audit
## Rebuild roadmap and phase-by-phase implementation prompts

**Audit target:** `untitled.md` (single-file React/TypeScript implementation of Likhara Studio)  
**Prepared:** 17 November 2026  
**Primary environment:** Android phone running Termux, with headless Chromium installed  
**Available coding agents:** Antigravity CLI and OpenCode CLI, using an NVIDIA NIM API  
**Available design/refactoring skills:** Ponytail, Impeccable, Taste  
**Constraint:** Do not assume MCP servers, hosted browser tools, desktop IDEs, or paid cloud services are available.

**Branding update:** The product name is now **Likhara** (formerly Canvix / Canvix Studio). Use Likhara in user-facing titles, navigation, documentation, and new branding. Preserve legacy storage keys and persisted identifiers where required for backward-compatible migration.

---

# 1. Executive assessment

Likhara has the beginnings of a useful visual UI builder: a recursive component tree, a component palette, a property inspector, a canvas, responsive viewport controls, undo/redo concepts, drag-and-drop, resizing, and code export.

The main problem is not that the editor needs a prettier coat of paint. The product is missing important application structure, and some of the generated output does not preserve the behavior implied by the editor. The current experience appears to drop users directly into the editor instead of giving them a project-oriented starting point. The visual language also leans on familiar AI-generated SaaS patterns rather than a deliberate product design system.

**Recommendation:** treat this as a controlled product rebuild, not a full rewrite of every underlying concept. Preserve the useful tree/schema and editor capabilities where they are sound. Rebuild the application shell, project lifecycle, design system, state/history boundaries, component behavior model, and export validation around them.

Do not let an agent replace the entire file in one giant generation pass. Work in small, verifiable phases. Each phase must build, run, and pass its acceptance checks before the next phase begins.

## Overall audit verdict

| Area | Assessment | Priority |
|---|---|---:|
| Product structure / first-run experience | No proper project home/start page is evident; app enters editor directly | Critical |
| Project lifecycle | Current persistence is centered on one workspace/tree, not a complete multi-project workflow | Critical |
| Visual design | Generic dark/indigo/glass/gradient-heavy visual language | High |
| Editor interactions | Several behaviors need functional verification and more reliable state boundaries | Critical |
| Undo/redo | History is coupled to tree commits; high-frequency edits may create noisy history | High |
| Drag/drop and resizing | Native drag/drop and custom resizing need device/browser verification, especially touch and nested targets | High |
| Generated code | React exporters omit important behavior such as anchor destinations and button actions | Critical |
| Forms and inputs | Exported inputs do not yet represent a complete form behavior model | High |
| Import/export | JSON import has a basic root check; schema validation and safe recovery need strengthening | High |
| Responsive behavior | Viewport preview exists, but real device layout and editor usability require testing | High |
| Accessibility | Needs systematic keyboard, focus, labels, and contrast verification | High |
| Runtime quality | No full runtime/build/browser test was performed as part of this source audit | Must verify |

---

# 2. Scope, evidence and confidence

This audit is based on the supplied `untitled.md` source. It is a static source review, not a claim that every suspected defect has been reproduced in a running browser.

### Evidence labels

- **Confirmed from source:** directly visible in the supplied implementation.
- **Strong concern:** implementation structure creates a credible risk, but runtime reproduction is still required.
- **Needs runtime verification:** cannot responsibly be called broken until tested in the running application.

### Important source landmarks

The supplied file is a large, single React/TypeScript source document (approximately 5,201 lines in the file retrieval view). Useful landmarks identified during review include:

- Core types and recursive `UINode` model: beginning of file.
- Workspace persistence key: `canvix_studio_v4_workspace`.
- Autosave and history handling: around the state/persistence section; `commitTree`, `replaceCurrentTreeFrame`, `handleUndo`, and `handleRedo`.
- React + Tailwind compiler: `compileToReactTailwind` around lines 2039–2086.
- React inline-style compiler: `compileToReactInlineStyle` around lines 2099–2144.
- File wrappers for the React exporters: around lines 2088–2097 and 2146–2155.
- Main editor state and rendering: around lines 2385–2460 and later render sections.
- Drag/drop implementation: around lines 2744–2925.
- Canvas rendering: around lines 3150–3180.
- Export/import and UI action handlers: around lines 3332–3340 and nearby sections.

Line numbers are approximate landmarks for navigation. Use symbol search in the current checked-out project before editing; do not blindly assume the uploaded document's line numbers match a reorganized repository.

---

# 3. Detailed findings

## 3.1 Missing start page and project lifecycle

**Finding — confirmed from the observed application structure:** the app opens directly into the visual editor. There is no complete project home/dashboard flow before the editor.

A visual builder should not assume every visit means “continue editing the same tree.” Users need a place to understand what they have, create a new project, reopen a project, import an existing project, and choose a starting point.

### Missing or incomplete product flow

1. App entry / home.
2. Recent projects.
3. Create project.
4. Choose blank project or starter template.
5. Name project and define initial canvas settings.
6. Open project in editor.
7. Save and return to project home.
8. Rename, duplicate, delete, import, and export projects.
9. Recover from invalid or unavailable saved project data.

### Required home page content

- Product name and concise purpose.
- Primary “New project” action.
- Recent projects with project name, last edited time, and a small preview/thumbnail if feasible.
- Empty state for a first-time user.
- Import project action.
- Template gallery only if actual usable templates exist.
- Settings/help entry only if they have real destinations and behavior.

Do not build a marketing landing page inside the app. This is a productivity tool. The start page should help users start or resume work quickly.

### Project lifecycle acceptance criteria

- First visit opens the home page, not a blank editor.
- “New project” creates a uniquely identified project and opens it.
- Returning home and reopening a project restores its tree and metadata.
- Renaming, duplicating, deleting, importing, and exporting work.
- Deletion has a confirmation step and cannot accidentally erase the wrong project.
- A failed save is visible and recoverable; never silently discard work.
- Existing single-workspace data is migrated or offered for import rather than silently overwritten.

## 3.2 Visual design: generic AI-generated aesthetic

**Finding — confirmed from source styling and component defaults:** the design language leans heavily on dark slate surfaces, indigo/violet accents, glass panels, blur, glow shadows, gradients, large rounded corners, and decorative borders.

The issue is not that dark mode, purple, gradients, or glass are inherently bad. The issue is their default and repeated use without a distinct product rationale. The result risks looking like a generic AI-generated dashboard/editor.

### Patterns to remove or sharply restrict

- Indigo/violet as the default accent for every action and state.
- Glow shadows as a standard component treatment.
- Glassmorphism as a default container style.
- Large rounded corners on nearly every surface.
- Gradient backgrounds used as decoration rather than communication.
- Repeated cards where a clear list, table, toolbar, or simple section would work better.
- Tiny uppercase labels and excessive decorative metadata.
- High-contrast dark surfaces that make the actual canvas compete with the editor chrome.

### Recommended design direction

Read Likhara as a **professional creative tool / visual editor**, not a marketing site. Use an operational interface: calm, precise, dense enough for work, with a strong hierarchy and restrained personality.

A suitable direction to explore:

- Neutral graphite or warm-neutral application chrome, with a clean canvas surface.
- One deliberate accent color for selection, focus, and primary actions.
- Clear separation between editor chrome and the user's design canvas.
- Compact but touch-usable controls.
- Consistent spacing and radius tokens.
- Strong typography hierarchy, not oversized marketing typography.
- Minimal shadows; use borders, spacing, and surface contrast for grouping.
- Visible focus, selected, hover, disabled, saving, and error states.
- Avoid gratuitous motion; animate only meaningful state changes.

Do not pick a new palette randomly. Define and document a small token system before restyling individual screens.

### Visual design acceptance criteria

- The home page and editor share one coherent design system.
- Canvas content is visually distinct from editor controls.
- Primary, secondary, destructive, and quiet actions are consistently differentiated.
- Selection and focus states do not rely on color alone.
- The interface works at narrow phone widths and desktop widths.
- The final result does not depend on gradients, glow, glass, or giant cards to look designed.

## 3.3 Code generation does not preserve all editor semantics

**Finding — confirmed from the inspected compiler implementations:** the React + Tailwind and React inline-style compiler functions serialize the visual tree, tags, text, styles, images, inputs, textareas, and children, but the inspected paths do not preserve all interaction semantics.

Examples of important gaps:

- Anchor nodes have an `href` field in the editor model, but the inspected exporters do not serialize the destination.
- Button nodes can be styled and displayed, but the output does not provide a complete configurable action model.
- Inputs and textareas are emitted without a complete form state, validation, submission, and error behavior model.
- An exported result can therefore look like the editor canvas while behaving differently.

This is a product correctness issue. A visual builder must not imply that a button or form is functional when the generated code is only decorative markup.

### Required fix

Define behavior in the node schema, not as ad hoc click handlers hidden inside the editor.

Suggested behavior model:

- Link: destination URL, open-in-new-tab option, accessible label.
- Button: action type such as `none`, `navigate`, `submit`, or a documented custom event; action configuration.
- Input: input type, name, label, placeholder, required, default value, validation constraints.
- Textarea: name, label, placeholder, required, default value, min/max length.
- Form: submit behavior, method/action where supported, success/error state strategy.
- Image: source, alt text, fit, dimensions, and upload/replace behavior.

Do not claim that a form sends data to a server unless a backend endpoint or a supported integration is configured. A standalone export may provide client-side validation and a documented submit callback, but must not pretend to persist submissions.

### Export acceptance criteria

For each supported output format:

- All visible content is present.
- Styling is equivalent within documented limitations.
- Links navigate to the configured destination.
- Buttons perform the configured action.
- Inputs preserve type, name, label, required state, and constraints.
- Forms validate and show understandable feedback.
- Images include alt text and valid sources.
- Exported code compiles or validates in an isolated test fixture.
- Unsupported behavior is clearly reported, not silently dropped.

## 3.4 Single-workspace persistence is not a project system

**Finding — confirmed from the observed storage design:** the source uses a single workspace key (`canvix_studio_v4_workspace`) and autosaves the current tree. That is not enough to represent a multi-project application.

### Risks

- Creating another design may overwrite or replace the only saved tree.
- There is no complete project metadata model.
- Recent projects cannot be reliably listed without a project index.
- Project-specific settings and canvas dimensions have no clear ownership.
- Import/export and autosave are centered on a tree rather than a versioned project document.

### Recommended project document

At minimum:

```ts
type LikharaProject = {
  schemaVersion: number;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  viewport: {
    width: number;
    height: number;
    background: string;
  };
  root: UINode;
};
```

Add fields only when a real feature needs them. Do not create a plugin architecture, collaboration model, cloud sync, or complex workspace abstraction without a current requirement.

### Storage recommendation

For a browser-only, local-first app:

- `localStorage` is acceptable for small preferences and simple metadata.
- Use IndexedDB for project documents and larger data such as image blobs.
- Consider a small wrapper or a lightweight IndexedDB library only if it materially simplifies reliable transactions and migrations.
- Do not add a server/database dependency solely to support a local prototype.
- Provide explicit JSON project export/import as a portable backup.

Storage must be versioned and migration-aware.

## 3.5 Undo/redo and state transaction boundaries

**Finding — confirmed concern from source structure:** `commitTree` adds a history frame when called, while the tree is autosaved whenever it changes. This can work for discrete operations, but high-frequency editing may produce noisy history if every keystroke or slider movement commits a new frame.

The source also has a `replaceCurrentTreeFrame` helper intended to update the current frame during continuous resizing. This indicates that history boundaries are already a special concern.

### Recommended behavior

- Text typing should be grouped into sensible undo transactions, not one history item per character.
- Dragging/resizing should create one undoable operation per completed gesture.
- A style slider should group changes during a drag and commit once when released.
- Reordering, deleting, duplicating, adding, and moving nodes should each be discrete transactions.
- Undo and redo must restore selection where sensible, not just the tree.
- History must be bounded to avoid unbounded memory growth.
- A failed storage write must not corrupt the in-memory history.

Use an explicit transaction model. Avoid adding a large state-management library unless the current state model proves impossible to maintain.

## 3.6 Drag-and-drop and nested component operations

**Finding — source confirms native HTML drag/drop logic exists. Runtime behavior still needs verification.**

The implementation handles palette insertion and canvas-node movement, including checks for self-targeting and descendant relationships. This is a useful foundation, but nested tree editors are particularly vulnerable to edge cases.

### Required test cases

- Insert a palette item before, after, and inside a container.
- Move a leaf into a container.
- Move a container with children.
- Reorder siblings.
- Move a node out of a nested container.
- Reject dropping a parent into its own descendant.
- Drop at the top and bottom of long lists.
- Drop while scrolling.
- Drop when the target is hidden or locked.
- Cancel a drag without changing the tree.
- Test touch interaction on an Android phone, not only desktop mouse input.

Native HTML drag-and-drop is not consistently pleasant on touch devices. If touch drag is unreliable, use a well-supported pointer-based approach or add explicit move/reorder controls as an accessible fallback. Do not install a heavy drag library without first testing the current implementation.

## 3.7 Resize behavior

**Finding — resizing exists in the source, but its real-world constraints require verification.**

Check:

- Width never exceeds the parent or canvas unexpectedly.
- Minimum width and height remain usable.
- Resizing works at 50%, 100%, and 150% canvas zoom.
- Resizing while the page is scrolled uses correct coordinate math.
- Pointer cancellation and touch interruption do not leave the editor stuck.
- Resize handles do not cover content or block normal selection.
- A resize is one undoable operation.
- Mobile editor controls remain reachable.

Do not add arbitrary width/height behavior to node types that cannot support it meaningfully.

## 3.8 Import validation and data safety

**Finding — confirmed from the inspected import handler:** JSON import parses the file and performs a basic root identifier check before committing the tree. A root check is not a schema validator.

### Required validation

- Validate schema version.
- Validate node tag against the supported tag allowlist.
- Validate IDs and uniqueness.
- Validate required fields and field types.
- Validate style tokens and numeric ranges.
- Validate child arrays recursively.
- Enforce reasonable maximum depth and node count.
- Reject malformed or unexpectedly large files safely.
- Never execute imported code.
- Preserve the existing project if import fails.
- Show a useful error message and allow the user to cancel.

Imported data is untrusted input. A valid JSON parse does not mean a valid Likhara project.

## 3.9 Accessibility and phone usability

The current source review does not establish WCAG compliance. Treat accessibility as a test requirement, not an assumption.

Minimum checks:

- All toolbar actions are real buttons with accessible names.
- Icon-only controls have labels.
- Inputs have associated labels.
- Keyboard users can reach and operate all editor actions.
- Focus is visible.
- Dialogs manage focus and Escape behavior.
- Selection is communicated with more than color.
- Text contrast is sufficient.
- Reduced-motion preferences are respected.
- Touch targets are large enough for a phone.
- The editor has a usable mobile layout, or clearly states that full editing is desktop-oriented while preserving a functional mobile experience.

## 3.10 Runtime and performance risks

The source is a large single-file component. That makes it harder to reason about feature boundaries and increases the chance that unrelated changes break the editor.

Do not split files just to satisfy a line-count rule. Extract by responsibility:

- Project persistence and migrations.
- Project home/dashboard.
- Editor shell.
- Canvas renderer.
- Component palette.
- Layer/tree panel.
- Inspector.
- History/transactions.
- Drag/drop and resize controllers.
- Import/export and code generators.
- Shared types and validators.

Use memoization only where measurement or clear render behavior justifies it. Do not create layers of wrappers and abstractions for one-off operations.

---

# 4. Product target and information architecture

The intended application should have four primary surfaces.

## 4.1 Home / project dashboard

Purpose: create, find, and manage projects.

- New project.
- Recent projects.
- Search or sort only if the number of projects warrants it.
- Import project.
- Template starter selection, only for real templates.
- Project actions: open, rename, duplicate, export, delete.

## 4.2 New project flow

Keep this short. Avoid a multi-step wizard unless necessary.

- Project name.
- Blank canvas or actual starter template.
- Optional starting viewport dimensions.
- Create and open.

## 4.3 Editor

Preserve the core visual-builder workflow:

- Top bar: project name, save status, undo/redo, preview, export, return home.
- Left panel: component palette and/or layers.
- Center: canvas with viewport controls and zoom.
- Right panel: selected node properties.
- Clear empty-canvas state.
- Selection, keyboard, and touch behavior.
- Responsive layout for narrow screens.

On phones, panels may become drawers or tabs. Do not simply shrink a desktop three-column editor until every control is unusable.

## 4.4 Preview and export

- Preview mode must disable editor-only affordances.
- Test desktop/tablet/mobile viewport sizes.
- Show output format and limitations.
- Validate output before download.
- Export project JSON separately from generated application code.
- Never label generated code “validated” unless an actual validation step ran.

---

# 5. Recommended implementation architecture

This is a direction, not permission to introduce unnecessary dependencies.

```text
src/
  app/
    App.tsx
    routes-or-view-state.ts
  features/
    projects/
      ProjectHome.tsx
      NewProjectDialog.tsx
      project-model.ts
      project-repository.ts
      project-migrations.ts
    editor/
      EditorShell.tsx
      Canvas.tsx
      CanvasNode.tsx
      PalettePanel.tsx
      LayersPanel.tsx
      InspectorPanel.tsx
      editor-history.ts
      editor-transactions.ts
      drag-controller.ts
      resize-controller.ts
    preview/
      PreviewShell.tsx
    export/
      export-panel.ts
      compile-react-tailwind.ts
      compile-react-inline.ts
      compile-html.ts
      validate-export.ts
  components/
    ui/
  domain/
    node-schema.ts
    node-validation.ts
    style-tokens.ts
  styles/
    tokens.css
    global.css
  tests/
    unit/
    integration/
    browser/
```

Adapt this to the actual repository and build setup. If the project is not already organized this way, migrate incrementally. Avoid a large directory shuffle that produces no user-facing benefit.

## Data model rules

- Keep the recursive node tree unless evidence shows it is fundamentally unsuitable.
- Give every project a stable ID.
- Add a schema version.
- Keep project metadata separate from editor transient state.
- Keep selected node, open panels, zoom, and active tab out of the persisted design tree unless there is a clear reason to persist them.
- Keep action behavior explicit in the node model.
- Validate every imported project and generated export.

---

# 6. Skills and tools that fit this workflow

The key constraint is that the coding workflow is **local CLI-first**. A skill is useful only if your chosen agent can actually read and apply it from local skill files or its own supported skill mechanism. Do not assume a ChatGPT plugin skill automatically becomes available inside OpenCode or Antigravity.

## 6.1 Skills you already have

### Ponytail — use for complexity control

Best use:
- Audit the repository for unnecessary abstractions and dependencies.
- Simplify state and component code after behavior is correct.
- Review each completed phase for unnecessary complexity.

Important limitation:
- Ponytail's audit mode is specifically about over-engineering and complexity. It is not a substitute for correctness, security, accessibility, or runtime testing.
- Run a normal correctness review separately.

Suggested timing:
- Phase 0: whole-repository complexity audit.
- After Phase 3 and Phase 5: focused simplification review.
- Final phase: remove unused code and dependencies.

### Impeccable — use for product UX and interface quality

Best use:
- Critique the existing interface.
- Plan the new home/start experience.
- Define the editor's information hierarchy.
- Audit accessibility, responsive behavior, empty states, and visual polish.
- Inspect the live app in a browser when its local workflow supports it.

Suggested commands/modes from the skill:
- `context`
- `critique`
- `shape`
- `onboard`
- `audit`
- `adapt`
- `harden`
- `polish`

Important limitation:
- Impeccable may ship its own scripts and references. Use them only if those files are actually installed and executable in your local environment. If not, ask the coding agent to follow the relevant skill principles manually. Do not block the project waiting for MCP.

### Taste — use selectively, not as the only design authority

Best use:
- Generate a distinctive visual direction and avoid generic AI styling.
- Establish typography, palette, spacing, and composition rules.
- Improve a specific visual surface after product structure is understood.

Important limitation:
- The installed Taste frontend skill explicitly says it is not intended as the primary skill for dashboards, dense product UI, data tables, multi-step product UI, or code editors. Likhara is a visual editor, so **do not blindly apply the landing-page recipe to the editor itself**.
- Use Taste for the home/marketing-like surface or visual direction exploration. Use Impeccable's Operate/product-UI guidance and frontend engineering rules for the actual editor.

## 6.2 Additional skills worth adding if locally available

| Skill / capability | Why it fits | When to use |
|---|---|---|
| Investigate First | Evidence before edits; separates symptom from root cause | Before fixing any broken interaction |
| Frontend UI Engineering | Component architecture, responsive behavior, accessibility, state discipline | Home page, editor shell, panels, dialogs |
| Full Output Enforcement | Helps prevent truncated/incomplete code generation | Large but bounded implementation tasks |
| Code Simplification | Clarity pass without behavior changes | After functionality is tested |
| Playwright/browser testing skill | Repeatable browser checks and screenshots | Every phase with UI changes |
| Accessibility audit skill | Keyboard, semantics, contrast, focus, labels | Before release |
| TypeScript/React testing skill | Unit and integration test design | Tree operations, transactions, import/export |

If you can install only a few, prioritize:
1. Investigate First.
2. Frontend UI Engineering.
3. A browser automation / Playwright skill.
4. Full Output Enforcement.

Do not install a skill merely because its name sounds useful. Check that it is compatible with your agent and that its files are available locally.

## 6.3 MCP-free testing and inspection tools

These can be run locally from Termux if compatible with the existing Node setup.

### Browser automation

Preferred:
- Playwright, configured to use your already-installed headless Chromium executable.
- If Playwright cannot use the installed Chromium build on your Android/Termux environment, use the Chromium CLI directly for screenshots and basic page-load checks.

Do not assume Playwright's bundled browser can be downloaded or run on Android. First inspect the existing environment:

```bash
pwd
node --version
npm --version
which chromium || which chromium-browser || which chrome
chromium --version 2>/dev/null || chromium-browser --version 2>/dev/null
```

Use the exact executable path returned by `which`. Do not hardcode a guessed path.

A basic headless screenshot pattern (adjust executable name and flags to your installed build):

```bash
chromium \
  --headless \
  --no-sandbox \
  --disable-gpu \
  --hide-scrollbars \
  --window-size=390,844 \
  --screenshot=/tmp/likhara-mobile.png \
  http://127.0.0.1:PORT/
```

For desktop, repeat with a wider viewport. Replace `PORT` with the actual local dev-server port.

### Test stack

Use what the repository already has first. If no test stack exists and the project is Vite/React, consider:

- Vitest for unit tests.
- React Testing Library for component interactions.
- Playwright for end-to-end browser flows.
- axe-core or an equivalent accessibility checker for automated scans.

Do not add all of these at once. Start with the smallest stack that can verify the required behavior. A test runner that cannot run in Termux is not a useful dependency for this workflow.

### Static checks

- Existing package scripts (`npm run`, `pnpm run`, or `yarn run` as appropriate).
- TypeScript compiler.
- ESLint if already configured.
- Build command already defined by the repository.

Do not replace the package manager or upgrade the framework during the audit unless there is a demonstrated blocker.

## 6.5 Skill activation protocol — required for every phase

Skills are **not assumed to activate automatically** just because they are named in this roadmap. Before each phase, the implementation agent must check which skills are actually installed and accessible in its own environment, read the relevant skill instructions, and explicitly apply only those that fit the work. ChatGPT-installed skills do not automatically transfer to Gemini, OpenCode, Antigravity, or another CLI agent.

### Required activation sequence

1. **Inspect availability:** identify the current agent, its supported skill mechanism, and the skills actually available locally. Do not claim access based on this roadmap alone.
2. **Select narrowly:** choose the phase-specific skills in the matrix below. Add another skill only when its purpose is clear and relevant.
3. **Read before use:** load the full applicable skill instructions and any required references before planning or editing. If a skill cannot be read or executed, state that limitation and use its principles manually only if appropriate.
4. **Plan:** summarize the task, target files, risks, expected behavior, and tests before changing code.
5. **Implement:** make the smallest coherent change for the current phase. Do not let a skill expand scope into later phases.
6. **Verify independently:** run the phase's checks and inspect the actual result. A design/review skill is not a substitute for tests; a test passing is not a substitute for a code review.
7. **Review:** use a separate review pass where possible. Check the diff for scope creep, regressions, data loss, security problems, and unnecessary complexity.
8. **Report:** list skills actually used (and unavailable skills), changed files, exact commands, test results, known issues, and manual checks still required.
9. **Stop:** do not start the next phase until the user has tested the current phase and approved continuation.

### Stage 1 phase-to-skill and verification matrix

| Phase | Recommended skills / workflows | Minimum verification before completion |
|---|---|---|
| 0 — Repository reconnaissance | Caveman Explore for broad read-only orientation; Investigate First for unexplained failures; Ponytail for a separate complexity inventory | Record repository map and baseline; run existing build/tests without edits; identify actual browser executable; capture screenshots if possible; distinguish reproduced defects from hypotheses |
| 1 — Product foundation and project home | Impeccable (`context`, `shape`, `onboard`, `critique` as relevant); Frontend UI Engineering; Taste only for visual direction exploration, not as the editor's sole design authority | Verify create/open/rename/duplicate/delete/import/export project flows; persistence and isolation across at least two projects; empty/recovery states; responsive screenshots; build and relevant automated tests |
| 2 — Design system and visual redesign | Impeccable (`shape`, `adapt`, `audit`, `polish`); Frontend UI Engineering; Taste selectively for a distinctive visual direction; High-End Visual Design only if compatible with the product UI | Verify design tokens are consistently applied; keyboard focus, contrast, selected/disabled/error states; phone and desktop layouts; no regressions to editor interactions; build and UI tests |
| 3 — Editor state, history and core interactions | Investigate First before fixing reproduced bugs; Frontend UI Engineering; Code Simplification/Ponytail after behavior is correct | Test selection, nested edits, undo/redo, history grouping, autosave/reload, drag/drop, resize, touch/pointer behavior; verify no accidental data loss; run unit/integration tests and build |
| 4 — Component semantics and functional behavior | Frontend UI Engineering; Investigate First for existing behavior defects; Full Output Enforcement only for bounded large code-generation tasks | Test links, buttons, inputs, forms, validation, keyboard behavior, and accessibility semantics in the editor model; confirm behavior survives save/reload and is represented in export; add regression tests |
| 5 — Exporters, preview fidelity and import safety | Investigate First; Frontend UI Engineering; Code Simplification/Ponytail after parity is demonstrated; security review workflow if available | Compare editor preview with each exported format; test links/actions/forms; validate malformed and legacy imports; confirm round-trip behavior and migration safety; build exported output and run regression tests |
| 6 — Accessibility, responsive QA and performance | Impeccable (`audit`, `adapt`, `harden`); Frontend UI Engineering; accessibility audit skill/tool if actually available; browser automation if supported | Keyboard-only pass; focus order/visibility; labels and semantics; contrast; phone/tablet/desktop viewport checks; performance smoke checks; automated accessibility scan where runnable; regression build/tests |
| 7 — Final cleanup, release readiness and handoff | Ponytail / Code Simplification; Impeccable (`audit`, `polish`); independent code/diff review | Clean build; full test suite; smoke-test all critical flows; check dependency and unused-code changes; verify migration and backup/restore; document unresolved issues and release limitations |

### Skill-use evidence in the phase report

Include a short section in every phase report:

- **Skills available:** names verified in the current agent environment.
- **Skills loaded and used:** exact skill names and the task they informed.
- **Unavailable / not used:** relevant skills that could not be accessed, or skills deliberately skipped and why.
- **Verification evidence:** commands and observable results. Never write “skill passed” as a substitute for reporting actual tests.

A skill recommendation is not a dependency. If the skill is unavailable, continue with a transparent fallback rather than inventing installation or tool access.

---

## 6.4 OpenCode and Antigravity CLI operating rules

Use either agent as the implementation worker. Avoid having two agents edit the same working tree at the same time.

Recommended division:
- One agent investigates and writes a concise plan.
- One agent implements a single phase.
- A separate review pass checks the diff and tests.

For NVIDIA NIM:
- Keep the API key in environment variables or the CLI's supported secret store.
- Never paste the key into prompts, source files, screenshots, logs, or Git.
- Confirm which model is configured and its context/output limits.
- Ask for small diffs and bounded files, not a 5,000-line rewrite.
- If the agent truncates output, have it continue from a named file/task boundary rather than regenerating the whole project.

Suggested agent instruction:

> You are working in a local Termux environment. Do not depend on MCP, hosted browser tools, desktop-only applications, or unavailable services. Inspect the repository and available commands before choosing tools. Use the installed headless Chromium executable for browser verification when possible. Preserve the existing stack unless a concrete technical reason requires a change. Make changes only for the current phase. Do not proceed to the next phase. Run the available checks, report exact commands and results, and stop for my review.

---

# 7. Phased rebuild plan

## Phase 0 — Repository reconnaissance, baseline and safety

**Goal:** establish what is actually in the repository before changing anything.

**Do not implement features in this phase.**

### Work

- Inspect the full repository, package scripts, dependencies, entry points, styles, and build setup.
- Locate the current Likhara component and the functions named in this audit.
- Determine whether the uploaded source is already integrated into a project or is a standalone component.
- Identify existing tests and the actual local browser executable.
- Run the current build and available tests.
- Capture baseline desktop and phone screenshots if the app can run.
- Back up the working tree or create a Git checkpoint before modifications.
- Produce a concise map of files and risks.

### Detailed prompt

```text
PHASE 0 — RECONNAISSANCE ONLY. DO NOT EDIT PRODUCT CODE.

You are auditing Likhara Studio in a local Termux environment on Android.
Available tools may include Node/npm, OpenCode CLI or Antigravity CLI,
NVIDIA NIM API, and a locally installed headless Chromium. MCP is not
available. Do not assume any other tool exists.

Inspect the repository before proposing changes:
1. Print the current directory and list the project structure.
2. Read package.json, lockfile, TypeScript/build configuration, and all
   relevant app entry points.
3. Identify the framework, package manager, build command, test command,
   CSS system, and current dependency versions.
4. Locate the UINode model, project storage, autosave, history, drag/drop,
   resize, canvas renderer, import handler, and all export compiler functions.
5. Confirm whether the application has a home/start page or enters the
   editor directly.
6. Run the existing build and tests without changing code.
7. Detect the installed Chromium executable and determine whether it can
   open the local app headlessly. Do not download another browser.
8. Capture baseline screenshots at a phone viewport (390x844) and desktop
   viewport (1440x900) if the app can run.
9. Identify current runtime errors, console errors, and broken flows only
   when you can reproduce them. Separate observations from hypotheses.
10. Create a backup or Git checkpoint before any future implementation.

Deliver:
- Repository map.
- Existing stack and commands.
- Baseline build/test result.
- Baseline screenshots paths if created.
- Confirmed issues vs. unverified concerns.
- Recommended minimal test tooling.
- A phase-by-phase risk list.

Do not edit product code, do not install dependencies, and do not begin
Phase 1. Stop and wait for approval.
```

### Exit criteria

- Baseline build/test status is known.
- Working tree is backed up or checkpointed.
- Repository structure and actual tool availability are documented.
- No product code changed.

---

## Phase 1 — Product foundation and project home

**Goal:** add a real project entry point and project lifecycle without destabilizing the editor.

### Work

- Introduce a project document and metadata model.
- Add project home/dashboard.
- Add new project flow.
- Add open, rename, duplicate, delete, import, and export project actions.
- Persist multiple projects locally.
- Add schema version and migration from the existing single-workspace key.
- Keep editor behavior intact when a project is opened.

### Detailed prompt

```text
PHASE 1 — PROJECT HOME, PROJECT MODEL AND LOCAL PERSISTENCE.

Implement only the application foundation and project lifecycle.

Product requirements:
- The first screen must be a useful Likhara project home, not the editor.
- The home screen must show recent projects and a clear New Project action.
- A first-time user must see a purposeful empty state with New Project and
  Import Project actions.
- New Project creates a uniquely identified project and opens it.
- Users can reopen, rename, duplicate, export, and delete projects.
- Delete must require confirmation.
- Import must validate before changing saved data.
- Returning home and reopening a project must restore its exact design tree.
- Show a clear save status: saving, saved, or save failed.

Data requirements:
- Create a versioned LikharaProject document containing id, name,
  createdAt, updatedAt, viewport settings, schemaVersion, and root tree.
- Keep editor-only transient state out of the persisted design document.
- Support multiple projects.
- Use local-first persistence. Prefer IndexedDB for project documents if
  the current environment supports it; keep localStorage for small settings.
  Do not add a backend or account system.
- Migrate the existing `canvix_studio_v4_workspace` tree safely.
- Never silently overwrite or discard the old workspace during migration.
- Add a migration test and a recovery path.

Engineering constraints:
- Inspect existing code and preserve the working recursive UINode model.
- Do not rewrite the canvas, inspector, drag/drop, or exporters in this phase.
- Use existing dependencies where possible.
- Do not introduce a large state-management or database dependency without
  proving it is needed.
- Keep changes focused and build after implementation.

Tests:
1. First launch shows Home.
2. Create project opens editor.
3. Return Home and reopen project restores tree.
4. Create two projects; verify neither overwrites the other.
5. Rename and duplicate project.
6. Delete one project; verify the other remains.
7. Export and import a project.
8. Simulate invalid import; verify current project remains unchanged.
9. Simulate storage failure if feasible; verify visible error and no silent loss.
10. Verify legacy workspace migration.

Stop after Phase 1. Report changed files, migration behavior, test commands,
test results, and any known limitations. Do not start Phase 2.
```

### Exit criteria

- All project lifecycle actions work.
- Existing workspace is migrated safely.
- No regression in opening and editing a project.
- Storage failures are not silent.

---

## Phase 2 — Design system and visual redesign

**Goal:** replace the generic AI-style visual language with a coherent tool interface.

### Work

- Define `DESIGN.md` or equivalent project design brief.
- Define color, typography, spacing, border, radius, focus, and elevation tokens.
- Redesign home page.
- Redesign editor shell and panel hierarchy.
- Make phone behavior intentional.
- Preserve the canvas as the user's work surface.
- Add meaningful empty, loading, saving, error, selected, and disabled states.

### Detailed prompt

```text
PHASE 2 — LIKHARA DESIGN SYSTEM AND INTERFACE REDESIGN.

Redesign the product UI as a professional visual editor. This is an
OPERATE-mode product interface, not a marketing landing page.

Before editing:
1. Read the existing UI and Phase 0 screenshots.
2. Read the product and user-flow requirements.
3. Use Impeccable to critique the existing interface and define the new
   information hierarchy. If its local scripts are unavailable, apply its
   critique and operate-mode principles manually.
4. Use Taste only to explore a distinctive visual direction where useful.
   Do not apply landing-page patterns to the editor.
5. Write a concise design brief and token specification before styling.

Design constraints:
- Remove generic AI styling: no default purple glow, no glass panel on every
  surface, no random gradients, no giant rounded cards, no decorative noise.
- Choose one deliberate accent color and a consistent neutral foundation.
- Keep editor chrome visually separate from the actual canvas.
- Use typography hierarchy and spacing to communicate structure.
- Use borders and surface contrast before shadows.
- Use a consistent radius scale.
- Keep controls compact but comfortably touchable.
- Every icon-only action needs an accessible name.
- Provide clear hover, focus, selected, pressed, disabled, saving, saved,
  and error states.
- Do not add fake content, fake project metrics, or decorative dashboard
  widgets.
- The home page should prioritize recent projects and project creation.
- On narrow screens, use a deliberate panel/drawer/tab strategy. Do not
  squeeze a desktop three-column layout into a phone width.
- Respect reduced-motion preferences.

Implement:
1. Design tokens and global styles.
2. Home page visual redesign.
3. Editor shell and toolbar redesign.
4. Palette/layers/inspector panel styling.
5. Empty, loading, error, and save-status states.
6. Responsive layouts.

Verification:
- Capture desktop 1440x900 and phone 390x844 screenshots.
- Check for horizontal overflow and clipped controls.
- Keyboard-tab through every visible action.
- Verify selected and focus states are distinguishable without color alone.
- Compare screenshots against the written design brief.

Do not change editor data behavior or export semantics in this phase.
Do not add a component library unless the current project needs one.
Stop after Phase 2 and report screenshots, changed files, and test results.
```

### Exit criteria

- One documented design system is used consistently.
- Home and editor are visually coherent.
- Phone layout is usable.
- No visual regression hides or removes existing editor controls.

---

## Phase 3 — Editor state, history and core interactions

**Goal:** make editing predictable and reliable before adding new features.

### Work

- Centralize tree operations.
- Define transaction boundaries.
- Fix undo/redo grouping.
- Ensure selection remains valid after delete/move/import.
- Fix drag/drop nesting and touch behavior.
- Fix resize math and constraints.
- Add keyboard alternatives for reorder and move.
- Prevent stale state and accidental mutation.

### Detailed prompt

```text
PHASE 3 — EDITOR CORRECTNESS: TREE, HISTORY, DRAG/DROP AND RESIZE.

Use an investigate-first workflow. Do not change code until each defect has
a reproducible test or a clearly documented implementation gap.

Preserve the recursive UINode data model unless evidence proves it must change.

Tree operations:
- Centralize add, remove, duplicate, update, reorder, move, and reparent
  operations in pure functions where possible.
- Enforce unique node IDs.
- Reject cycles and moving a parent into its descendant.
- Keep selection valid after tree changes.
- Keep locked and hidden behavior consistent.
- Do not mutate existing tree objects in place.

History:
- Implement transaction-based undo/redo.
- One text-edit session should be one sensible undo transaction, not one
  history item per character.
- A resize or slider drag should be one transaction when completed.
- Add, delete, duplicate, reorder, and move should each be discrete actions.
- Bound history size.
- Undo/redo must restore the tree and a sensible selection state.
- Do not create history entries for no-op updates.

Drag/drop:
- Test palette insertion before, after, and inside.
- Test moving leaf nodes and containers with children.
- Test nested containers, sibling reorder, scrolling, cancellation,
  locked nodes, hidden nodes, and invalid descendant drops.
- Verify drop indicators match the actual insertion result.
- Test mouse and touch on the target Android device.
- If native HTML drag/drop is unreliable on touch, implement a small
  pointer-based interaction or accessible move controls. Do not install
  a heavy library without evidence.

Resize:
- Correctly account for canvas zoom and scroll position.
- Enforce sensible min/max constraints.
- Prevent overflow beyond supported parent constraints.
- Handle pointer cancellation and touch interruption.
- Ensure resize handles do not block selection.
- Make resize a single undoable transaction.

Accessibility:
- Provide keyboard-accessible move up/down or equivalent reorder controls.
- Keep focus stable after actions.
- Expose useful labels and states.

Tests:
- Add unit tests for pure tree operations.
- Add tests for undo/redo transaction grouping.
- Add browser tests for representative drag/drop and resize flows.
- Manually test touch behavior on the phone.
- Run build and existing tests.

Do not redesign the visual system in this phase.
Stop after Phase 3 and report reproducible bugs fixed, tests, and remaining
limitations. Do not begin Phase 4.
```

### Exit criteria

- Tree operations pass unit tests.
- Undo/redo is predictable.
- Drag/drop and resize work at multiple zoom levels.
- Touch behavior has been tested on the actual phone.

---

## Phase 4 — Component semantics and functional behavior

**Goal:** make editor components behave as users expect, not just look correct.

### Work

- Expand node schema for links, buttons, inputs, forms, and images.
- Add inspector controls for these properties.
- Add accessible labels and validation configuration.
- Implement preview behavior.
- Keep behavior data-driven and serializable.
- Document unsupported behavior clearly.

### Detailed prompt

```text
PHASE 4 — REAL COMPONENT BEHAVIOR AND INSPECTOR CONTROLS.

Make the visual builder's components semantically functional.

Do not add arbitrary JavaScript strings or execute user-imported code.
Behavior must be represented as validated, serializable configuration.

Update the node model only as required:
- Link: href, target behavior, accessible label.
- Button: action type and configuration.
- Input: type, name, label, placeholder, default value, required,
  min/max length, and supported constraints.
- Textarea: name, label, placeholder, default value, required,
  min/max length.
- Form: submit behavior and validation configuration.
- Image: source, alt text, fit, dimensions, and replacement behavior.

Inspector:
- Show only properties relevant to the selected component.
- Use real labels and helpful validation messages.
- Prevent invalid URLs and unsupported input types.
- Make required/disabled/read-only states clear.
- Preserve all values after save, reload, duplicate, and import.

Preview:
- Links navigate to their configured destination.
- Buttons execute the configured action.
- Inputs accept and retain values in preview.
- Forms perform client-side validation and show success/error feedback.
- Do not claim server submission unless a real endpoint is configured.
- Editor selection handles and editing overlays must not appear in preview.

Images:
- Support a valid URL and local file selection if the existing platform
  supports it.
- Validate file types and sizes.
- Preserve alt text.
- Do not silently convert large images into localStorage strings.

Tests:
- Link navigation.
- Button action variants.
- Input types and constraints.
- Required form validation.
- Form success/error feedback.
- Image source and alt text.
- Save/reload and project import/export preservation.

Stop after Phase 4. Report the exact supported behavior model and any
intentional limitations. Do not start Phase 5.
```

### Exit criteria

- Every component's preview behavior matches its configuration.
- No misleading nonfunctional controls.
- Values survive save/reload/import.
- No arbitrary imported code execution.

---

## Phase 5 — Exporters, preview fidelity and import safety

**Goal:** ensure exported code is valid, predictable, and honest about limitations.

### Work

- Improve React + Tailwind exporter.
- Improve React inline-style exporter.
- Improve standalone HTML exporter.
- Preserve semantic attributes and configured behaviors.
- Validate exports.
- Add schema-based import validation and migrations.
- Add clear error reporting.

### Detailed prompt

```text
PHASE 5 — EXPORT FIDELITY, CODE VALIDATION AND SAFE IMPORT.

Audit each exporter independently:
- React + Tailwind.
- React inline styles.
- Standalone HTML/CSS.
- Project JSON export.

Do not assume that output is correct because it looks plausible in a code
viewer. Validate it.

Export requirements:
1. Preserve all supported tags and nested children.
2. Preserve styles with documented format-specific limitations.
3. Preserve links and href values.
4. Preserve button action semantics.
5. Preserve input types, names, labels, placeholders, required state,
   and supported validation constraints.
6. Preserve form behavior where the target format supports it.
7. Preserve image source and alt text.
8. Escape text and attribute values correctly.
9. Prevent malformed markup and unsafe attribute injection.
10. Use stable, deterministic output where practical.
11. Never show a "validated" status unless a real validation completed.

Validation:
- Create minimal export fixtures for each component type.
- Compile generated React output in an isolated fixture if the environment
  permits.
- Validate standalone HTML structure and test it in headless Chromium.
- Run generated output at desktop and phone viewport sizes.
- Test links, buttons, inputs, and forms in the exported result.
- Report unsupported behavior rather than silently dropping it.

Import:
- Validate schemaVersion.
- Validate node types, tags, IDs, styles, child arrays, and field types.
- Reject duplicate IDs, invalid ranges, excessive depth, and excessive node
  counts.
- Set reasonable file-size limits.
- Do not execute imported code.
- Do not replace the current project until validation succeeds.
- Provide actionable errors and preserve the current document on failure.
- Add migration tests for older project versions.

Do not add server-side export infrastructure.
Stop after Phase 5 and provide sample generated output plus validation
results for every format.
```

### Exit criteria

- All exporters preserve supported behavior.
- Generated code is validated in a real test environment.
- Invalid imports cannot damage the current project.
- Export limitations are documented.

---

## Phase 6 — Accessibility, responsive QA and performance

**Goal:** test the product as an actual phone-first Termux user and as a desktop browser user.

### Work

- Keyboard navigation.
- Focus management.
- Contrast and labels.
- Touch target and panel usability.
- Responsive breakpoints.
- Reduced motion.
- Large project performance.
- Save reliability.
- Browser console and runtime error checks.

### Detailed prompt

```text
PHASE 6 — ACCESSIBILITY, RESPONSIVE AND PERFORMANCE HARDENING.

Run a bounded QA pass. Do not redesign the product or add unrelated features.

Responsive sizes:
- 320x720
- 390x844
- 768x1024
- 1024x768
- 1440x900

Accessibility:
- Keyboard access to all primary actions.
- Visible focus indicators.
- Correct heading hierarchy.
- Accessible names for icon-only buttons.
- Labels for all form controls.
- Dialog focus management and Escape handling.
- Status messages announced appropriately.
- No color-only status communication.
- Contrast checks for text and interactive controls.
- Reduced-motion support.

Responsive:
- No horizontal overflow.
- No clipped toolbar actions.
- No inaccessible off-screen inspector controls.
- Panels adapt to narrow screens.
- Canvas remains distinguishable from app chrome.
- Touch targets are comfortable.
- Virtual keyboard does not hide active controls or text fields.

Performance:
- Test a small project and a larger project with many nested nodes.
- Measure interaction responsiveness during selection, typing, drag, and
  resize.
- Check autosave frequency and storage errors.
- Check image memory/storage behavior.
- Avoid unnecessary re-renders, but optimize only where measured.
- Check for event listener leaks and timers not cleaned up.

Use headless Chromium for automated screenshots and browser flows where
compatible. If a browser automation package cannot run on Termux, document
the blocker and use direct Chromium CLI screenshots plus manual phone tests.

Deliver a concise defect list ranked by severity. Fix all critical and high
severity issues found in this pass. Stop after Phase 6.
```

### Exit criteria

- All target viewport screenshots inspected.
- Critical/high defects fixed.
- Keyboard and touch checks completed.
- No known data-loss or project-corruption issue.

---

## Phase 7 — Final cleanup, release readiness and handoff

**Goal:** remove dead code and prepare a stable release candidate.

### Work

- Run Ponytail audit.
- Remove unused dependencies and dead code only when safe.
- Check package scripts and build output.
- Update README and user workflow instructions.
- Add a concise known-limitations section.
- Confirm backup/export recovery.
- Create a final test report.

### Detailed prompt

```text
PHASE 7 — RELEASE READINESS AND FINAL SIMPLIFICATION.

The product features are complete. Do not add new features.

1. Run the available build and full test suite.
2. Run a normal correctness review.
3. Run Ponytail whole-repository audit for over-engineering only.
4. Review each proposed deletion before applying it. Do not remove code
   merely to reduce line count.
5. Remove genuinely unused code and dependencies.
6. Check imports, types, console errors, warnings, and broken links.
7. Verify project export/import recovery.
8. Verify first-run home, project creation, editor, preview, export, and
   return-home flows.
9. Capture final desktop and phone screenshots.
10. Update README with:
    - How to install dependencies.
    - How to run the dev server.
    - How to run tests and build.
    - How to use headless Chromium if configured.
    - How local project storage works.
    - How to back up and restore projects.
    - Current limitations.
11. Do not claim production readiness if any critical/high issue remains.

Final report:
- Build and test commands with exact results.
- Screenshots and viewport sizes.
- Files changed.
- Dependencies added/removed and reasons.
- Known limitations.
- Backup/recovery instructions.
- Release recommendation: ready / ready with limitations / not ready.

Stop after this phase.
```

---

# 8. Global rules to prepend to every phase prompt

> **Skill activation is mandatory, but skill availability is not assumed.** Before each phase, inspect the skills actually available to this agent, read the relevant instructions, and apply only the phase-appropriate skills listed in Section 6.5. Report exactly which skills were loaded and used. ChatGPT plugin skills are not automatically available inside Gemini or local CLI agents. If a skill is unavailable, state that and use a transparent manual fallback. Skills never replace builds, tests, browser checks, or independent review.


Copy this block before any phase prompt when using OpenCode or Antigravity.

```text
GLOBAL PROJECT RULES — LIKHARA STUDIO

Environment:
- I work on an Android phone using Termux.
- I use CLI coding agents such as OpenCode or Antigravity.
- The model API is NVIDIA NIM.
- Headless Chromium is installed locally.
- MCP is unavailable. Do not require MCP tools.
- Do not assume a desktop IDE, Docker, hosted browser, cloud database,
  external agent service, or paid tool is available.

Workflow:
- Complete exactly one phase at a time.
- Do not start the next phase without my explicit approval.
- Inspect the current repository before editing.
- Preserve the existing framework and package manager unless there is a
  demonstrated blocker.
- Prefer small, reviewable diffs over rewriting large files.
- Do not replace the entire application with a generated mockup.
- Do not remove working functionality to make the interface simpler.
- Do not add dependencies without explaining the need and compatibility.
- Do not invent test results or claim that a test passed if it was not run.
- Do not claim a feature is functional because it looks correct.
- Do not leave TODO placeholders for required behavior.
- Do not create fake success states or fake data.
- Keep API keys and secrets out of source files and prompts.

Quality:
- Use evidence before fixing bugs.
- Preserve project data and provide migrations.
- Keep accessibility and phone usability in scope.
- Use headless Chromium for browser verification when it works locally.
- If a tool cannot run in Termux, explain the exact limitation and provide
  the best compatible alternative.
- Run build/tests after meaningful changes.
- Inspect the final diff for accidental unrelated changes.

Phase handoff:
- State what changed.
- List exact files changed.
- List exact commands run.
- Report test/build results honestly.
- List unresolved defects and limitations.
- Give me a short manual test checklist.
- Stop and wait for my report before continuing.
```

---

# 9. Suggested manual test checklist

Use this after each relevant phase.

## Home and project lifecycle

- [ ] First launch opens Home.
- [ ] Empty state is understandable.
- [ ] Create project works.
- [ ] Rename works.
- [ ] Duplicate works.
- [ ] Delete confirmation works.
- [ ] Reopen restores the design.
- [ ] Return Home works.
- [ ] Import valid project works.
- [ ] Import invalid project does not replace current work.
- [ ] Exported project can be restored.

## Editor

- [ ] Add each component type.
- [ ] Select and deselect nodes.
- [ ] Edit text.
- [ ] Change style values.
- [ ] Move nodes within and between containers.
- [ ] Delete and duplicate nodes.
- [ ] Undo and redo each action.
- [ ] Resize at multiple zoom levels.
- [ ] Test nested containers.
- [ ] Test locked and hidden nodes.
- [ ] Test phone touch interactions.

## Preview and export

- [ ] Preview hides editor controls.
- [ ] Desktop/tablet/mobile viewport changes work.
- [ ] Link navigates.
- [ ] Button action works.
- [ ] Input accepts data.
- [ ] Form validation works.
- [ ] Image alt text is present.
- [ ] React + Tailwind output validates.
- [ ] React inline output validates.
- [ ] HTML output works in Chromium.
- [ ] Exported project JSON can be imported.

## Quality

- [ ] No console errors.
- [ ] No clipped controls.
- [ ] No horizontal overflow.
- [ ] Keyboard focus is visible.
- [ ] Icon-only actions have accessible labels.
- [ ] Save status is accurate.
- [ ] No data loss after reload.
- [ ] Phone layout is usable.

---

# 10. What not to do

1. **Do not rewrite all 5,000+ lines in one AI response.** That is high risk and difficult to review.
2. **Do not start with visual polish.** The project lifecycle and behavior gaps are more important.
3. **Do not use Taste as the sole design skill for the editor.** Its landing-page bias is not the right fit for a dense operational tool.
4. **Do not install a large UI framework just to make the interface look modern.**
5. **Do not add cloud sync, authentication, teams, collaboration, billing, or analytics unless explicitly required.**
6. **Do not assume drag-and-drop works on touch because it works with a mouse.**
7. **Do not equate a successful TypeScript build with working application behavior.**
8. **Do not say “validated” unless an actual validation ran.**
9. **Do not store large image blobs or base64 payloads in localStorage.**
10. **Do not allow imported JSON to bypass validation.**
11. **Do not run two coding agents against the same working tree simultaneously.**
12. **Do not put the NVIDIA NIM API key in a prompt, repository, or shell history.**

---

# 11. Recommended order of operations

| Order | Action | Reason |
|---:|---|---|
| 1 | Phase 0 reconnaissance | Know the real repository and establish a rollback point |
| 2 | Phase 1 project home and persistence | Fixes the missing start page and fundamental product structure |
| 3 | Phase 2 design system | Gives the app a coherent visual identity |
| 4 | Phase 3 editor correctness | Makes core editing reliable |
| 5 | Phase 4 component behavior | Makes the editor produce functional components |
| 6 | Phase 5 export/import | Makes generated output and project files trustworthy |
| 7 | Phase 6 QA and hardening | Verifies phone and desktop behavior |
| 8 | Phase 7 release cleanup | Removes safe complexity and prepares handoff |

**Do not skip Phase 0.** The supplied source is not enough to determine the current package setup, exact runtime compatibility, or whether some issues have already been fixed in the actual repository.

---

# 12. Final recommendation

Likhara should become a project-based visual builder with a proper home page, reliable local project storage, a focused editor, explicit component behavior, and exports that preserve that behavior.

The strongest approach for this environment is:

- **OpenCode or Antigravity:** implementation agent, one phase at a time.
- **Investigate First:** reproduce and explain defects before edits.
- **Impeccable:** product UX, editor information architecture, responsive/accessibility critique.
- **Taste:** visual direction exploration, used selectively rather than as a dashboard/editor template.
- **Frontend UI Engineering:** component boundaries, accessible controls, responsive implementation.
- **Ponytail:** simplify after correctness, not instead of correctness.
- **Headless Chromium:** local screenshots and browser checks.
- **Vitest / React Testing Library / Playwright:** only if the existing stack and Termux runtime support them.

The priority is not to make Likhara look more impressive in a screenshot. It is to make the application coherent, dependable, and genuinely useful from first launch through project creation, editing, preview, and export.
