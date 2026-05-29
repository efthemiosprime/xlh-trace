# 09 — Accessibility (first-class requirement)

Target: **WCAG 2.2 AA**. Accessibility is part of the definition-of-done for every UI chunk —
not a later polish pass. This is a health tool for a patient/caregiver audience, so inclusive
access matters more than usual. Tested with: keyboard-only, a screen reader (VoiceOver/NVDA),
and automated `axe` checks (Playwright + axe-core in Phase 4).

## `A11Y-1` Semantic structure & landmarks
- Real elements: `<button>` for actions (never a clickable `<div>`), `<a>` for navigation,
  `<input>`/`<select>` for fields. The app root is a `<main>`; the step indicator is a `<nav>`.
- Exactly one `<h1>` per screen; headings nest in order (no skipped levels). The eyebrow
  ("STEP 1 - …") is not a heading — the screen title is.

## `A11Y-2` Keyboard
- Everything operable by keyboard; **logical tab order** matches visual order.
- **Visible focus indicator** on every focusable element — never remove `outline` without a
  replacement ring (≥3:1 contrast). Provide a "Skip to content" affordance if needed.
- `Enter`/`Space` activate buttons; arrow keys move within radio groups.

## `A11Y-3` Forms (Steps 1–6)
- Every field has a programmatic `<label for>` (or `aria-label`). Required fields use
  `aria-required="true"` **and** the visible `*`.
- Radio groups wrapped in `<fieldset>` + `<legend>` ("Gender assigned at birth",
  "Do you have XLH?"). Validation errors: `aria-describedby` → message with `role="alert"`,
  and `aria-invalid` on the field. Don't rely on color alone for error state.

## `A11Y-4` Color & contrast — never color-only meaning
- Text ≥ **4.5:1**, large text / UI components / focus rings ≥ **3:1**. (Steel `#343e59` on
  snow `#f6f6f6` and snow on magenta `#ad0b49` both pass; verify any lime-on-white usage —
  lime `#c9e87c` is low-contrast, so **never** put text/essential info in lime on white.)
- **XLH status is conveyed by fill + an always-present text label** (Has XLH / May have XLH /
  No XLH), plus the legend — not by the green fill alone (`INH-11`, `UI-ICON`). Chromosome
  chips carry text (X/Y) and an accessible name, not just color.

## `A11Y-5` Dynamic updates (single page, no route change)
- Step/screen transitions and computed results are announced via a polite `aria-live`
  region (since URL/page title doesn't change — `FLOW-STATE`). On step change, move focus to
  the new screen's `<h1>` (or its container) so SR users land in context.
- The **50-person limit** message uses `role="alert"` (assertive).

## `A11Y-6` Overlays / modals (`FLOW-9`, DS-POPUP)
- `role="dialog"` + `aria-modal="true"`, labelled by its title (`aria-labelledby`).
- **Focus trap** inside; **`Esc` closes**; on open move focus into the dialog, on close
  **restore focus to the trigger**. Background made inert (`inert`/`aria-hidden`).

## `A11Y-7` Icons & images
- Decorative art (the start-screen family illustration, ornamental chrome) → `aria-hidden`
  / empty `alt`. Meaningful icons (person status, chromosome X/Y, add/edit) have an
  accessible name (`aria-label` / `<title>` in SVG).

## `A11Y-8` Motion
- Respect `prefers-reduced-motion`: no essential info conveyed only by animation; reduce or
  disable non-essential transitions/Rive playback.

## `A11Y-9` Reflow, zoom & target size (ties to embedding)
- Content reflows with no loss at **320 CSS px** width and **200% zoom** (relevant in the
  host iframe, `EMBED-8`). No horizontal scrolling at those sizes.
- Pointer targets ≥ **24×24** CSS px (WCAG 2.2); aim for ≥ 44×44 for primary CTAs.
- The host `<iframe>` must carry a `title` (`EMBED-7`).

## `A11Y-10` The pedigree must not be visual-only
- The SVG tree carries an accessible alternative: each node is focusable/announces
  "name — relationship — status", **or** an equivalent off-screen list / the details table
  (`PDF-2`) is exposed in-app. The tree `<svg>` has `role="img"` + a summary `aria-label`
  when treated as a single image.

## Definition of done (per UI chunk)
1. Keyboard-only walkthrough works (incl. Esc/focus-return on overlays).
2. `axe` reports no violations (Playwright).
3. Visible focus everywhere; labels/roles present; status has text not just color.
4. Reflows at 320px / 200% zoom.
