# Screen impl — Wizard Shell (shared by steps 1–6)

The chrome that wraps every wizard step. Responsive per `04-screens.md` / `TOKEN-5`
(switch at `$bp-desktop` 768px). Built once; each step renders into its content slot.

## Layout

> The outer container is the **global `DS-SHELL`** (`.page` + `.app-shell`, max-width 1200) —
> the same shell the start screen and summary use. The wizard chrome below lives *inside* it.

### Desktop (≥768px) — Figma symbols `1266:175xx`
The `.app-shell` card fills the viewport (steel field margin, like 0.0). Inside, top→bottom:
1. **Stepper** (`DS-STEPS` desktop): horizontal, 7 labeled nodes — *Tell us about yourself ·
   Add children · Add siblings · Add a parent · Add Aunts & Uncles · Add Grandparents · Your
   XLH Family Tree*. Current = lime-filled dot + bold steel label; visited/future = small
   dots + muted labels. Right: **EXIT** (`↦`).
2. **Two-column body**: LEFT (~42%) = the **input card** (lime-bordered snow card, the step's
   form/landing). RIGHT (~58%) = **live tree preview** (`createTreePreview`) reflecting the
   store + `StatusEngine`, with the status legend (`DS-LEGEND`) bottom-right.
3. **Nav**: `NEXT` (CTA) under the left card; `GO BACK` (steel-outline) appears for steps > 1;
   optional steps add `SKIP` on their landing.
4. **Consent footnote** (full-width, centered) at the bottom.

### Mobile (<768px) — Figma instances `1266:175xx`
1. **Lime top bar** (`DS-STEPS` mobile, 50px): `STEP n OF 6` (left) · **VIEW TREE** toggle
   (steel-outline pill) · **EXIT** (right).
2. The **input card** (form/landing).
3. `NEXT` (full-width CTA) + `GO BACK` (steps > 1) below.
4. **Consent footnote** at the bottom.
- **VIEW TREE** swaps the card for the tree preview (the `1.1-tree` variant) with a toggle
  back — the desktop right-pane equivalent.

## Components (factories, R2 — each returns `destroy()`)
- `createWizardShell(mount, { flow, store, engine })` → renders chrome, exposes a content
  slot + mounts `createStepper` and (desktop) `createTreePreview`; re-renders the active step
  on `flow` view-state change (`FLOW-STATE`). Owns EXIT + nav buttons.
- `createStepper(mount, { flow })` → progress; subscribes to `flow`.
- `createTreePreview(mount, { store, engine })` → live pedigree; subscribes to `store`,
  recomputes via `engine`; reused on mobile behind VIEW TREE.
- `createConsentFootnote(mount)` → static legal text.

## Logic
- The shell is driven by the **`WizardFlow`** view state (`FLOW-STATE`): `step` selects which
  step component fills the slot; `overlay` mounts a dialog over it; `back()` pops the stack.
- **NEXT** calls `flow.next()` (gated by the active step's `isValid()`); **GO BACK**
  `flow.back()`; **SKIP** `flow.skip()` (optional steps). **EXIT** ends → SUMMARY (`FLOW-8`)
  after confirm.
- Tree preview re-renders on every store mutation; statuses from `StatusEngine` (`INH-*`).

## Accessibility (`A11Y-*`)
- Stepper is a `<nav aria-label="Progress">`; current step `aria-current="step"`.
- One `<h1>` per step (the step title) — shell provides landmarks `<header>`/`<main>`.
- On step change, move focus to the step `<h1>` and announce via the shell's `aria-live`
  region (`A11Y-5`). Tree preview gets an accessible alternative (`A11Y-10`).
- NEXT disabled state mirrors `isValid()`; never color-only.

## Tests
- jsdom: shell renders stepper + slot; NEXT calls `flow.next()` only when step valid; GO
  BACK/SKIP/EXIT wired; overlay mounts/teardown restores focus.
- Playwright: desktop two-column vs mobile lime-bar + VIEW TREE toggle; reflow at 320/200%.
