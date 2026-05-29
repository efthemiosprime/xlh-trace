# XLH Family Tree Tool — Specification (Source of Truth)

This `specs/` directory is the **authoritative specification** for the XLH Family Tree
Tool, derived from three source artifacts (in priority order):

1. **Figma design** — `26-CRYSVT-0261 Family Outreach Tool`
   (node `204:979`, file `b4bf3fgE9z0ow9hlAXzVuy`). The visual + interaction truth.
2. **Logic deck (PDF)** — `26-CRYSVT-0261_FamilyOutreachToolLogicDeck.pdf` (15 pages).
   The behavior + inheritance-rule truth.
3. **Genetic reality of XLH** — X-linked dominant inheritance, used to resolve any
   ambiguity left by the two artifacts above.

> The existing `SPEC.md` at the repo root describes the **old** implementation and is
> superseded by this directory. Code is refactored to match these specs, not vice-versa.

## Development method

**Spec-driven + TDD.** Every behavioral requirement has a stable ID (e.g. `INH-3`,
`FLOW-7`). Tests reference the ID in their description. The loop is:

1. Write/adjust the requirement here.
2. Write a failing test (`tests/*.spec.js`) that cites the ID — **red**.
3. Implement the minimal logic to pass — **green**.
4. Refactor.

Pure, UI-free logic (`src/engine`, `src/wizard/flow`) is specced and tested first.
UI screens (pixel-faithful to Figma) are built against the green logic afterward.

## Requirement ID namespaces

| Prefix | Domain | Doc |
|--------|--------|-----|
| `DM-`   | Domain model (Person, enums, store) | [01-domain-model.md](01-domain-model.md) |
| `INH-`  | Inheritance / status-percentage engine | [02-inheritance-logic.md](02-inheritance-logic.md) |
| `FLOW-` | Wizard flow state machine | [03-wizard-flow.md](03-wizard-flow.md) |
| `UI-`   | Screens & components (Figma) | [04-screens.md](04-screens.md) |
| `PDF-`  | Downloadable PDF export | [05-pdf-export.md](05-pdf-export.md) |
| `R-`    | Architecture & coding conventions | [06-architecture.md](06-architecture.md) |
| `EMBED-`| iframe embedding (single page, in XLHLink.com) | [07-embedding.md](07-embedding.md) |
| `TOKEN-`/`DS-` | Design tokens & component variants (Figma) | [08-design-system.md](08-design-system.md) |

## Status legend used throughout

| Result (computed/displayed) | Meaning | Pedigree fill |
|------|---------|---------------|
| `HAS_XLH` | Has XLH (100%) | solid green chromosome |
| `MAY_HAVE_XLH` | May have XLH (50% or unquantified) | half green chromosome |
| `NO_XLH` | No XLH (0%) | outline / no green |

User **input** is always one of `YES` / `NO` / `UNSURE` (per the deck), distinct from
the computed **result** above.
