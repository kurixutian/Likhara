# Likhara Studio — Design Brief & Token Specification (Phase 2)

**Mode:** Operate (working editor — scanability, standard controls, category polish; no marketing patterns).
**Critique basis:** Phase 1 screenshots (`screenshots/phase1-*.png`) + Impeccable Operate/craft-floor principles applied manually (local critique scripts unavailable in this CLI build; `detect` reported no source-level findings).

## Critique of the incumbent (evidence → decision)

| Evidence (Phase 1 captures) | Decision |
|---|---|
| Header items compete: brand, name input, badge, actions all boxed and equal weight | De-emphasize brand to a chip; name as quiet inline field; save state as the only colored pill on the left |
| Chrome and canvas both near-black; separation by hairline only | One darker "workbench well" behind the artboard; panels one step lighter; artboard keeps project-defined background |
| Type mostly 10–12px with no scale steps | 4-step UI scale (11 meta / 12 UI / 13 titles / 14 page); mono chips for technical values |
| Radius mixed (`rounded`, `md`, `lg`, `xl`) | Fixed radius scale via theme tokens; no arbitrary radii in chrome |
| Inspector controls double-boxed (panel border + control border) | Single surface per panel; controls separated by hairlines, not nested boxes |
| No visible keyboard focus system | Global `:focus-visible` ring (accent, offset) across the app |
| Mobile shows the desktop three-column layout squeezed | Canvas-first drawers (pattern below) + compact toolbar with overflow |
| Browser defaults (selection, scrollbars, caret) unthemed | Themed from the palette |

## Identity

- **One accent:** Sky (`sky-500` family) — reserved for selection, primary actions, and active controls. Nothing else gets color except state semantics (emerald = saved/success, amber = in-progress, rose = error/destructive-hover).
- **Neutral foundation:** the zinc scale (cool graphite) as-is; chrome reads one step lighter than the canvas well.
- **Signature move:** the *semantic mono chip* — every technical value (HTML tags, save state, timestamps, viewport, node counts, versions) renders as a small monospace chip (`<section>`, `Saved`, `desktop · 100%`). It is the product's semantic-fidelity story made visible and is used consistently, never decoratively.
- **Type:** system UI stack (deliberate: operate-mode tools favor the platform voice; no webfont dependency offline). Mono: `ui-monospace` stack for chips and code.
- **Depth:** borders and surface contrast first; shadows only for true overlays (drawers, menus, modal) with offset + blur. No glows, no gradients, no glass in chrome. (Blur/backdrop tokens remain available as *user design data* on the artboard — that is content, not chrome.)

## Token specification

Radius (theme overrides): `sm 4 · md 6 · lg 8 · xl 8 · 2xl 10 · 3xl 12` px — chrome never uses arbitrary values.
Control heights: desktop 28px; touch targets ≥ 40px on coarse pointers (padding, not scale).
Spacing: 4px grid; panel padding 12; section separation 16–24.
Text contrast: primary `zinc-100` on chrome (≥ 12:1); secondary `zinc-400` (≥ 4.5:1 on `zinc-900`); meta `zinc-500` only in mono chips ≥ 3:1 against their surface.
Focus: 2px `sky-400` outline, 2px offset, radius-tracked — never removed.

## States (all chrome controls)

hover (surface tint) · focus-visible (ring, distinguishable from selection by being outside the control) · selected (accent tint + label/weight, never color alone — active tabs gain bold text + surface; canvas selection keeps ring + floating name bar) · pressed (native) · disabled (40% opacity + `disabled:` cursor) · saving (amber chip) · saved (emerald chip) · error (rose chip + message).

## Mobile pattern (documented decision)

**Full-height slide-in side drawers, one at a time** (chosen over bottom sheets): palette, layers, and the inspector are tall scan-lists whose desktop reading pattern is vertical; a drawer preserves that pattern and keeps the canvas visible behind for spatial context, while a bottom sheet would cover exactly the canvas the user is styling. Drawers: ≤ 85vw (max 380px), overlay with scrim, close button + scrim tap; the selection and editor state are untouched by open/close. **Coordination:** opening Components/Layers closes Properties and vice versa — never both drawers, so the canvas keeps at least ~50% width on a 390px phone.

**Compact toolbar (< 1024px):** Home · project name · save chip · Undo · Redo · overflow menu (`⋯ More actions`) containing: workspace mode, viewport switcher, Import JSON, Export JSON, Reset. Secondary actions stay discoverable, never shrunk to nothing. The canvas toolbar (selection info, grid, zoom) scrolls horizontally instead of wrapping.

**Panels hidden by default on < 1024px:** the canvas is the primary surface. Components/Layers reachable via the Components toggle (their existing tab switch stays inside the drawer); Properties opens on demand for the current selection and closes without affecting it.

**Keyboard:** the app shell uses `100dvh`; drawers scroll internally; text inputs get 16px on coarse pointers (prevents focus-zoom); nothing essential sits under the on-screen keyboard's default cover area — action buttons in drawers sit at the bottom of scrollable content, not fixed behind it.

**Reduced motion:** all transitions/animations collapse under `prefers-reduced-motion: reduce`.

## Non-goals (Phase 2)

No canvas/renderer behavior changes, no new component library, no data-model or exporter edits, no fake metrics or decorative widgets.
