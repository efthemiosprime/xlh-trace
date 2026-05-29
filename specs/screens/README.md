# Per-screen implementation specs

Detailed build specs per screen, derived by reviewing **both** the desktop and mobile Figma
frames for every state. Each cites requirement IDs from the top-level specs (`DM-`, `INH-`,
`FLOW-`, `UI-`, `DS-`, `A11Y-`). Build order within Phase 4: the shell first, then each step.

| Doc | Covers | Status |
|-----|--------|--------|
| [00-wizard-shell.md](00-wizard-shell.md) | Shared chrome (global `DS-SHELL` + stepper + tree preview + nav), desktop two-column / mobile lime-bar | reviewed |
| [01-step-self.md](01-step-self.md) | Step 1 — Tell us about yourself (1.1–1.6), all states both layouts | reviewed |
| `02-step-children.md` | Step 2 — Add children (landing/skip, input, review) | todo |
| `03-step-siblings.md` | Step 3 — Add siblings (+ their children overlay) | todo |
| `04-step-parent.md` | Step 4 — Pick a parent (Mom/Dad/Neither/IDK, disabled-Dad) | todo |
| `05-step-aunts-uncles.md` | Step 5 — Aunts & uncles (+ their children) | todo |
| `06-step-grandparents.md` | Step 6 — Grandparents (maternal/paternal) | todo |
| `07-summary.md` | Final tree + profile popup + download/share/reset | todo |
| (0.0 start) | Built — see `src/screens/StartScreen.*` | done |

## Review template (per screen)
For each screen capture: **states** (every Figma sub-frame), **components** (DS refs),
**desktop vs mobile** layout differences, **logic/behavior** (validation, reveals, side-
effects, flow transitions, engine recompute), **accessibility**, and **build tasks + tests**.
