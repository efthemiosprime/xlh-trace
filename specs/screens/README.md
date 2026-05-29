# Per-screen implementation specs

Detailed build specs per screen, derived by reviewing **both** the desktop and mobile Figma
frames for every state. Each cites requirement IDs from the top-level specs (`DM-`, `INH-`,
`FLOW-`, `UI-`, `DS-`, `A11Y-`). Build order within Phase 4: the shell first, then each step.

| Doc | Covers | Status |
|-----|--------|--------|
| [00-wizard-shell.md](00-wizard-shell.md) | Shared chrome (global `DS-SHELL` + stepper + tree preview + nav), desktop two-column / mobile lime-bar | ✅ reviewed |
| [01-step-self.md](01-step-self.md) | Step 1 — Tell us about yourself (1.1–1.6), all states both layouts | ✅ reviewed |
| **[patterns.md](patterns.md)** | **Pattern A "list step"** (Steps 2,3,5) + **Pattern B "chooser step"** (Steps 4,6) — both fully reviewed desktop+mobile, with per-step params + node IDs | ✅ reviewed |
| [07-summary.md](07-summary.md) | Step 7 — final tree + profile popup + download/share/reset/email | ✅ reviewed |
| (0.0 start) | Built — see `src/screens/StartScreen.*` | ✅ done |

Steps 2–6 are not separate docs — they are instances of the two templates in
[patterns.md](patterns.md). Components are catalogued in
[../component-catalog.md](../component-catalog.md).

## Review template (per screen)
For each screen capture: **states** (every Figma sub-frame), **components** (DS refs),
**desktop vs mobile** layout differences, **logic/behavior** (validation, reveals, side-
effects, flow transitions, engine recompute), **accessibility**, and **build tasks + tests**.
