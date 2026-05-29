# XLH Family Tree Tool — Project Instructions

Vanilla JS + Vite app. Source of truth for *what* to build: [`specs/`](specs/README.md)
(derived from the Figma design + the logic-deck PDF). The old root `SPEC.md` is superseded.

## Coding rules (enforced — full detail in [`specs/06-architecture.md`](specs/06-architecture.md))

- **R1 — Separate pure logic from DOM glue.** Logic that *computes* (inheritance %, flow
  decisions, validation, formatting) lives in `src/engine/`, `src/wizard/`, `src/data/`,
  `src/utils/` — **no `document`/`window`, unit-testable in the `node` env.** DOM glue lives
  in `src/components/` and is dumb: takes data, writes DOM, holds no business rules. A
  function that mixes the two is a refactor smell — split it.
- **R2 — A component is a factory returning `destroy()`.** It takes its mount + options, owns
  its DOM and listeners, and returns a teardown that removes every listener and node. The
  teardown is the contract — no `destroy()` = a leak. Parents call children's `destroy`.
- **R3 — Declarative: `view = f(state)`.** Mutate state in one place (the pub/sub store,
  `src/data/FamilyStore.js`); derive the view from it. Never rebuild `innerHTML` of a live
  region with listeners — use **event delegation** (`container.addEventListener` +
  `e.target.closest('[data-…]')`) so behavior survives re-renders. Use `textContent`, never
  `innerHTML`, for dynamic/user data (XSS).
- **R4 — Lean on the platform.** ES modules are the isolation boundary: one concern per file,
  small public API, rest module-private, **no `window.*` globals**. Auto-wire folders with
  `import.meta.glob` over hand-maintained barrels. **No Web Components / Shadow DOM.**
- **R5 — DRY with a brake.** Extract only after the *third* genuine repeat that shares a real
  reason to change. A little duplication beats the wrong abstraction.
- **Enhancement style** (attaching to markup we don't render): event delegation first;
  a behavior is a module `export default init(root)` guarded against double-init; config in
  `data-*` attributes; scope queries to `root`, never `document`. (R6–R9.)

## Workflow

- **Spec-driven + TDD.** Red test citing a requirement id (`INH-*`, `FLOW-*`, …) → minimal
  green → refactor. Pure logic (`engine/`, `wizard/`) is specced and tested first.
- **Chunked & commit-gated.** Work one phase ([`specs/PLAN.md`](specs/PLAN.md)) at a time;
  at each boundary get the phase's tests green, **commit**, and **stop** until prompted to
  continue.
- **Commit messages:** `feat(scope): …`, `fix(scope): …`, `style(scope): …`,
  `chore(scope): …`, `perf(scope): …`, `docs(scope): …`. Scope = the "what". **No author/
  trailer lines.** One focused commit per chunk.
- **Reuse first.** Repurpose existing modules per `specs/PLAN.md`'s reuse map; rewrite only
  what the new data model breaks. Optimize later.

## Tech stack

Vanilla ES modules + Vite. Tests: Vitest (`node` for logic, jsdom + `@testing-library/dom`
for components), Playwright for E2E + Figma visual regression. PDF: jspdf + svg2pdf.js
(+ jspdf-autotable for table pages). No UI framework.

## Embedding (single page in an iframe)

The tool is **one page** embedded via `<iframe>` in XLHLink.com ([`specs/07-embedding.md`](specs/07-embedding.md)).
- **No router, no full-page nav** — the flow machine tracks an in-memory view state
  (`{ step, screen, overlay, focusPerson, isEnded }` + a back stack); render is `view = f(viewState)`.
- **In-memory store only** — no `localStorage`/`sessionStorage`/cookies; reload restarts.
- **Auto-height** — publish content height to the host via `postMessage` with an origin
  allowlist (never `'*'`). Avoid `100vh`/viewport-anchored layouts.
- **Outbound links** target `_parent`/`_blank` + `rel="noopener"`; never trap the host.

## Accessibility (first-class — [`specs/09-accessibility.md`](specs/09-accessibility.md))

**WCAG 2.2 AA is part of definition-of-done, not a later pass.** Every UI chunk: semantic
elements (`<button>`/`<label>`/`<fieldset>`+`<legend>`), keyboard-operable with visible focus,
labels + `aria-required` on fields, `role="dialog"`+focus-trap+`Esc`+focus-restore on
overlays, `aria-live` for step/result changes (single page = no route announce), **status by
fill + text label, never color alone**, contrast ≥4.5:1 (≥3:1 large/UI; never lime text on
white), reflow at 320px/200%, targets ≥24px, decorative icons `aria-hidden`. The pedigree SVG
needs an accessible alternative. Verify with keyboard + `axe` (Playwright) before "done".

## Health-data note (PII/PHI)

This tool states user data "will not be stored, shared, or used for marketing." Never
persist personal/health data to `localStorage`/`sessionStorage`/cookies beyond the in-session
tree, never log PII/PHI, never send it to third parties. Treat violations as blocking.

## Quality bar

Before considering a JS change done, run the **js-code-review** skill's lens over it (race
conditions, leaks, security sinks, floating promises, coercion). See
`.claude/skills/js-code-review/`.
