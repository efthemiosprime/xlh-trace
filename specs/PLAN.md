# Implementation Plan — Spec-Driven + TDD

Companion to the specs in this directory. Strategy reconciled with the codebase:

> **Greenfield for the pure logic core** (status engine + flow state machine — small,
> deterministic, heavily tested) — because the data model fundamentally changed.
> **Repurpose everything else** (store, DOM utils, tree renderer, PDF export, wizard
> shell, shared components) by adjusting it to the new model. **Optimize later.**

## Working cadence (chunked, commit-gated)

- Work proceeds **one phase (chunk) at a time**. At the end of each phase we **stop**.
- At each stop: run the phase's tests green, then **commit** that chunk.
- **Do not start the next phase** until explicitly prompted to continue.
- **Commit message format** (conventional, scope = "what", **no author/trailer lines**):
  - `feat(what): …` — new behavior/capability
  - `fix(what): …` — bug fix
  - `style(what): …` — formatting/visual, no logic change
  - `chore(what): …` — tooling, deps, scaffolding
  - `perf(what): …` — performance
  - `docs(what): …` — docs/specs only
- One focused commit per chunk (split only if a chunk clearly spans two types).

The single biggest change rippling through the codebase is the **data-model swap**:

| Old field | New field | Notes |
|-----------|-----------|-------|
| `xlhStatus: affected\|unaffected\|unknown` | `answer: yes\|no\|unsure\|null` | raw user input (DM-2) |
| `computedStatus`, `probability` | `result: has_xlh\|may_have_xlh\|no_xlh`, `chance: 0\|50\|100\|null` | engine output (DM-3, INH-*) |
| — | `symptoms: string[]` | new (DM-5) |
| `RELATIONSHIP` (6 values) | + `SIBLING`, `COUSIN`, `NIBLING`, `PARTNER` | new flow (DM-4) |
| `STEPS` (6) | 7 incl. `SIBLINGS` + `START`/`SUMMARY` | new flow (FLOW-1) |

---

## Codebase reuse map

| File | Disposition | What changes |
|------|-------------|--------------|
| `utils/dom.js`, `utils/events.js`, `utils/id.js` | ♻️ **Reuse as-is** | none |
| `data/constants.js` | 🔧 **Extend** | add `XLH_ANSWER`, `XLH_RESULT`, new `RELATIONSHIP`/`STEPS`, `SYMPTOMS` catalog; keep file (no new `model.js` — tests will import from here) |
| `data/FamilyStore.js` | 🔧 **Adjust** | new fields in `createPerson`; add `getPartner()`, `count()`, `canAddPerson()` (DM-8); **remove localStorage save/load** → in-memory only (DM-10, EMBED-2); keep pub/sub + queries |
| `engine/InheritanceEngine.js` | 🆕 **Replace** → `engine/StatusEngine.js` | new deterministic model (INH-1..11); retire old file |
| `engine/TreeAnalyzer.js` | 🔧 **Adjust** | origin/summary against `result`/`chance`; reuse ancestor-tracing |
| `components/wizard/WizardContainer.js` | 🔧 **Adjust** | drive from new `WizardFlow`; 7 steps, landing screens, skip, end-experience, limit |
| `components/wizard/StepProband.js` → `StepSelf` | 🔧 **Adjust** | Yes/No/Unsure, symptoms, add-partner overlay (FLOW-3) |
| `components/wizard/StepChildren.js` | 🔧 **Adjust** | landing (Yes/Skip), Yes/No/Unsure |
| `components/wizard/StepParents.js` → `StepParent` | 🔧 **Rework** | Mom/Dad/Neither/IDK selector + disabled-Dad (FLOW-5/5a) |
| `components/wizard/StepGrandparents.js` | 🔧 **Rework** | maternal/paternal selector (FLOW-6) |
| `components/wizard/StepAuntsUncles.js` | 🔧 **Adjust** | landing + their-children overlay |
| **new** `components/wizard/StepSiblings.js` | 🆕 **New** | step 3 (FLOW-1); pattern off StepChildren + their-children overlay |
| `components/wizard/StepTreeView.js` → `StepSummary` | 🔧 **Adjust** | new statuses, profile popup w/ chromosomes + symptoms |
| `components/shared/PersonForm.js` | 🔧 **Adjust** | Yes/No/Unsure radios + symptoms control + gating (DM-7) |
| `components/shared/{PersonCard,PersonList,Modal}.js` | ♻️ **Reuse** | restyle to Figma later |
| `components/tree/TreeRenderer.js` | 🔧 **Adjust** | rewire `personColor`/trunk logic to `result`/`chance`; keep layout math |
| `components/tree/{TreeNode,TreeConnectors,TreeLegend}.js` | 🔧 **Adjust** | chromosome chips + green-X highlight (UI-ICON); new legend labels |
| `utils/pdfExport.js` | 🔧 **Extend** | keep svg2pdf tree core (PDF-1); add table pages (PDF-2/3), symptoms page (PDF-4); new legend |
| `utils/shareExport.js` | ♻️ **Reuse** | email/share (UI-7.3/7.4) |
| `components/App.js`, `ProgressBar.js` | 🔧 **Adjust** | 7-step progress strip labels (UI-PROG) |
| `components/tree-builder/*`, `tree-builder.html` | 🗑️ **Retire** | single embedded page (EMBED-1); drop the second entry from the Vite build |
| root `SPEC.md` | 🗑️ **Supersede** | replaced by `specs/` (leave note) |

Legend: ♻️ reuse · 🔧 adjust · 🆕 new · ⏸️ defer · 🗑️ retire

---

## TDD phases

Each phase: **red** (failing tests citing requirement IDs) → **green** (minimal impl) →
**refactor** → **🛑 stop + commit** → wait for "continue". Pure-logic phases (1–2) first,
then store, then UI/visual, then PDF.

### Phase 0 — Harness + specs ✅ (code done; commit pending)
- Vitest + jsdom installed; `vite.config.js` `test` block; `npm test` scripts.
- `specs/` authored (01–05 + this plan); root `SPEC.md` marked superseded.
- **🛑 Commit:** `docs(specs): add spec-driven TDD specs, plan, and test harness`

### Phase 1 — Status engine (pure) 🎯 next
- **Spec:** [02-inheritance-logic.md](02-inheritance-logic.md) (INH-1..11).
- **Tests:** `tests/inheritance.spec.js` (written — full p14 truth table). *Currently red:
  imports `src/engine/StatusEngine.js` + `src/data/model.js` which don't exist.*
- **Reconcile:** point the test import at `src/data/constants.js` (extended enums), not a
  new `model.js`, per reuse strategy.
- **Impl:** extend `constants.js` (`XLH_ANSWER`, `XLH_RESULT`); add `StatusEngine.js`
  (`computeStatuses`, `statusLabel`), memoized top-down resolution.
- **DoD:** all of `tests/inheritance.spec.js` green; old `InheritanceEngine.js` retired.
- **🛑 Commit:** `feat(engine): add deterministic XLH status engine (INH-1..11)`

### Phase 2 — Wizard flow state machine (pure)
- **Spec:** [03-wizard-flow.md](03-wizard-flow.md) (FLOW-1..9, FLOW-LIMIT).
- **Tests:** `tests/wizard-flow.spec.js` (to write): step order incl. SIBLINGS; skip;
  partner-side shift (FLOW-3); disabled-Dad (FLOW-5a); Neither/IDK → SUMMARY (FLOW-8);
  maternal/paternal side (FLOW-6); 50-limit gate (FLOW-LIMIT); **view-state/screen tracking
  + overlay + back-stack (FLOW-STATE..STATE-2)**.
- **Impl:** `src/wizard/WizardFlow.js` (pure; no DOM; takes a store-like dependency).
  Tracks the `{ step, screen, overlay, focusPerson, isEnded }` view state and a back stack.
- **DoD:** flow tests green.
- **🛑 Commit:** `feat(wizard): add pure wizard flow state machine (FLOW-1..9)`

### Phase 3 — Domain model & store
- **Spec:** [01-domain-model.md](01-domain-model.md) (DM-1..9).
- **Tests:** `tests/store.spec.js`: new fields; `getPartner`/`count`/`canAddPerson`;
  50-person limit (DM-8); symptoms gating (DM-7); reference cleanup on remove;
  **no localStorage writes — in-memory only (DM-10)**.
- **Impl:** adjust `FamilyStore.js` + `constants.js` (relationships, symptoms catalog);
  **remove localStorage save/load**.
- **DoD:** store tests green; engine consumes store output unchanged.
- **🛑 Commit:** `feat(store): migrate family store to new data model (DM-1..9)`

### Phase 4 — Wizard UI (pixel-faithful, per screen)
- **Spec:** [04-screens.md](04-screens.md). Pull each mobile `<instance>` via Figma
  `get_design_context` as each screen is built.
- **Tests:** `tests/ui/*.spec.js` (jsdom) for behavior: render, validation, gating,
  landing/skip, overlays, disabled-Dad tooltip, limit popup.
- **Build order:** App/ProgressBar shell → Step 1 (+symptoms +partner) → Step 2 → Step 3
  (siblings) → Step 4 (parent + male variant) → Step 5 → Step 6 → wire `WizardFlow`.
- **DoD:** full wizard walkthrough matches Figma + flow tests.
- **🛑 Commit(s):** per logical group, e.g. `feat(wizard): build Step 1 self + symptoms
  (UI-1.x)`, `feat(wizard): add siblings step (UI-3.x)`, … (one commit per step/screen
  group; `style(wizard):` for pure Figma styling passes).

### Phase 5 — Tree visualization & summary
- **Spec:** UI-ICON, UI-SUMMARY, INH-11.
- **Tests:** `tests/ui/tree.spec.js`: node fill per `result`; chromosome highlight (male
  X); summary statuses; profile popup contents.
- **Impl:** rewire `TreeRenderer`/`TreeNode`/`TreeConnectors`/`TreeLegend`; `StepSummary`.
- **DoD:** p11/p12 tree reproduced; clicking a profile shows chromosomes + symptoms.
- **🛑 Commit:** `feat(tree): render pedigree with chromosome status icons (UI-ICON)`

### Phase 6 — PDF export (4 pages)
- **Spec:** [05-pdf-export.md](05-pdf-export.md) (PDF-1..6).
- **Tests:** `tests/pdf.spec.js`: builder produces 4 pages; table rows = people; status
  strings (INH-11); symptoms catalog page; 50-node pagination.
- **Impl:** extend `pdfExport.js`; reuse svg2pdf tree core; add table + symptoms pages.
- **DoD:** Download & Share produce the 4-page PDF; matches Figma export.
- **🛑 Commit:** `feat(pdf): generate 4-page family-tree PDF export (PDF-1..6)`

### Phase 7 — Embedding (iframe in XLHLink.com)
- **Spec:** [07-embedding.md](07-embedding.md) (EMBED-1..8).
- **Tests:** `tests/ui/embedding.spec.js` + Playwright: single entry (drop tree-builder
  input from Vite); auto-height `postMessage` with origin allowlist (EMBED-3); download/
  share work under iframe `sandbox`/`allow` (EMBED-5); links target `_parent`/`_blank`.
- **Impl:** height publisher util; single Vite input; host integration snippet/doc.
- **DoD:** embeds and auto-resizes in a host harness; downloads + mailto work in-iframe.
- **🛑 Commit:** `feat(embed): single-page iframe embedding with auto-height (EMBED-1..8)`

### Phase 8 — Polish (later)
- "Start over" clears the in-memory store; reset confirmation (UI-7.2); a11y (focus, ARIA,
  keyboard); responsive sweep across host widths (EMBED-8).
- **🛑 Commit(s):** `chore`/`style`/`perf`/`fix(...)` as appropriate per item.

---

## Tech stack assessment

Goal: best fit for *this* project — a mobile-first card wizard + SVG pedigree + 4-page PDF,
built on ~30 files of working vanilla JS we are repurposing, pixel-faithful to Figma.

| Concern | Current | Recommendation | Why |
|---------|---------|----------------|-----|
| Build/dev | **Vite** | **Keep** | Fast, already configured; Vitest pairs natively |
| Language | Vanilla **ES modules** | **Keep** | Reuse mandate; state layer is already clean (pub/sub store + pure `WizardFlow`). A framework would discard the code we're repurposing |
| UI rendering | Hand-rolled `h()` helper | **Keep** (`utils/dom.js`) | Sufficient at this scale; full control of SVG/pedigree |
| State | `FamilyStore` pub/sub + pure flow machine | **Keep** | Deterministic, testable without DOM |
| Unit/logic tests | **Vitest** | **Keep** | Vite-native, fast, ESM |
| DOM/UI tests | jsdom only | **Add `@testing-library/dom` (+ `user-event`)** at Phase 4 | Ergonomic, behavior-focused queries; avoids brittle selector tests |
| E2E + visual regression | none | **Add Playwright** at Phase 4 | Real-browser walkthrough, real PDF download, and pixel snapshots to verify Figma fidelity — things jsdom cannot do |
| Tree → PDF | **svg2pdf.js** | **Keep** | Vector tree, already working (PDF-1) |
| Tables → PDF | manual | **Add `jspdf-autotable`** at Phase 6 | Paginated tables for PDF-2/3 (50-node overflow) with far less code |
| PDF core | **jspdf** | **Keep** | Already a dep; autotable + svg2pdf both target it |

**Net:** keep the vanilla + Vite + Vitest core (honors reuse); add focused libraries each at
the phase that needs it: `@testing-library/dom` + **Playwright** (Phase 4), `jspdf-autotable`
(Phase 6). No framework migration. Each addition lands as its own `chore(deps): …` commit.

**Two test layers (not redundant):**
- **Vitest + jsdom + `@testing-library/dom`** — pure logic (engine/flow) and fast
  component/behavior tests. The majority of tests.
- **Playwright** — a thin E2E + visual-regression suite: full wizard happy paths, real PDF
  download, and Figma pixel snapshots. Use Playwright's **built-in** `getByRole`/`getByText`
  locators inside E2E — do **not** install `@testing-library/dom` into the Playwright layer
  (that would be the redundant part).

> If a UI framework is preferred despite the reuse cost, the lightest fit would be **Preact
> + HTM** (~4 kB, no build-step change) — but it implies rewriting Phase-4/5 UI components.
> Flagged as a decision below rather than assumed.

## Decisions

- **No new `model.js`** — extend `constants.js` (reuse). The one written test imports
  `model.js`; reconcile to `constants.js` at Phase 1 start.
- **Figma over deck on conflicts** (e.g. PDF is 4 pages, not "3 sections").
- **p14/p15 ambiguity** resolved by the reverse-engineered rule set in
  [02-inheritance-logic.md](02-inheritance-logic.md) — flagged, not silently chosen.
- **Single embedded page** (`EMBED-1`) — one Vite entry; tree-builder mode **retired**.
- **In-memory only, no persistence** (`DM-10`/`EMBED-2`) — iframe storage is partitioned/
  blocked and the tool promises not to store data; reload restarts.
- **No URL router** — the flow machine's view state (`FLOW-STATE`) tracks the current
  screen + overlay + a back stack; the renderer is `view = f(viewState)`.

## Open questions (non-blocking; default assumptions in specs)

1. **Spontaneous mutation** (20–30%, README/PDF intro): the deck's tree/table never label
   anyone "spontaneous". Assumption: not surfaced in v1 status output; revisit if Figma's
   summary copy calls for it.
2. **Compounding probabilities** beyond one generation (e.g. grandchild of a 50% person):
   spec INH-6 stops quantifying past a `MAY_HAVE` parent. Confirm that's intended.
3. **Niblings/cousins percentages:** only direct offspring of a `HAS_XLH` parent get a %;
   confirm aunts'/uncles' children should otherwise show qualitative "May have XLH".

## Optimizations backlog (explicitly later)

- Tree layout perf for ~50 nodes; viewBox virtualization.
- Memoize engine across store edits (incremental recompute).
- Extract Figma design tokens → CSS custom properties pipeline.
- Bundle-split PDF libs (jspdf/svg2pdf) out of the main entry.
- Component-ize repeated Figma atoms (Input Card, radios) into a small design-system layer.
