# XLH Family Tree - Inheritance Tracker

A web application that helps families affected by **X-linked Hypophosphatemia (XLH)** visualize inheritance patterns across generations. Built with vanilla JavaScript and Vite.

## What is XLH?

X-linked Hypophosphatemia is a genetic disorder caused by a mutation on the **X chromosome** (PHEX gene). It follows an **X-linked dominant** inheritance pattern, meaning only one copy of the mutated gene is needed to cause the condition.

Key genetic rules:

- **Affected father** passes his X to **all daughters** (100% carriers/affected), but sons receive the Y chromosome and are **unaffected** (0%)
- **Affected/carrier mother** has a **50% chance** of passing the mutated X to each child (sons or daughters)
- **~20-30% of cases** arise from **spontaneous mutations** with no family history

## Purpose

This tool allows users to:

1. Build a family tree through a guided 6-step wizard
2. Automatically analyze X-linked inheritance patterns
3. Identify probable carriers and the likely origin of XLH in the family
4. Visualize the results as an interactive, color-coded pedigree chart

## Architecture

```
src/
├── main.js                          # App bootstrap
├── style.css                        # Global styles + CSS custom properties
│
├── data/
│   ├── constants.js                 # Enums (SEX, XLH_STATUS, RELATIONSHIP, STEPS)
│   └── FamilyStore.js               # Singleton store with pub/sub + localStorage
│
├── engine/
│   ├── InheritanceEngine.js         # 3-pass inference algorithm
│   └── TreeAnalyzer.js              # Origin tracing + report generation
│
├── components/
│   ├── App.js                       # Root component
│   ├── ProgressBar.js               # Step indicator (dots + lines)
│   ├── wizard/
│   │   ├── WizardContainer.js       # Step navigation + validation
│   │   ├── StepProband.js           # Step 1: Primary person
│   │   ├── StepChildren.js          # Step 2: Children
│   │   ├── StepParents.js           # Step 3: Mother & Father
│   │   ├── StepAuntsUncles.js       # Step 4: Siblings of parents
│   │   ├── StepGrandparents.js      # Step 5: Grandparents
│   │   └── StepTreeView.js          # Step 6: Final tree + analysis
│   ├── shared/
│   │   ├── PersonForm.js            # Reusable form (name, sex, XLH status)
│   │   ├── PersonCard.js            # Compact person display
│   │   ├── PersonList.js            # List with add/remove
│   │   └── Modal.js                 # Edit modal
│   └── tree/
│       ├── TreeRenderer.js          # SVG layout engine
│       ├── TreeNode.js              # Pedigree node (square/circle)
│       ├── TreeConnectors.js        # Lines (spouse, parent-child, sibling bar)
│       └── TreeLegend.js            # Color legend
│
└── utils/
    ├── dom.js                       # createElement helpers
    ├── events.js                    # EventBus pub/sub
    └── id.js                        # UUID generation
```

### Data Flow

```
User Input (Wizard) --> FamilyStore --> InheritanceEngine --> TreeRenderer
                            |                                     |
                       localStorage                          SVG Output
```

The **FamilyStore** is a singleton that holds all person nodes with a pub/sub pattern. Any mutation triggers a save to localStorage and notifies subscribers. The store manages relationships (parent-child, spouse, sibling) as linked IDs.

## Inheritance Engine

The engine runs **4 passes** over the family tree to compute carrier status, probabilities, and origin:

### Pass 1: Backward Inference (bottom-up)

Walks from affected individuals upward through ancestors:

```
Affected Male                    Affected Female
     |                                |
     v                           v         v
Mother = CARRIER (100%)    Mother = ?    Father = ?
(his X came from her)      (50% each could be source)
```

- **Affected male** -> mother MUST be carrier (probability 1.0) because males only have one X, inherited from their mother
- **Affected female** -> at least one parent must carry the mutation. Mother could be a carrier (50%), father could be affected (50%)
- Continues propagating upward through grandparents

### Pass 2: Forward Inference (top-down)

Walks from affected/carrier individuals downward to children:

```
Affected Father                  Carrier Mother (50-100%)
    |          |                     |          |
    v          v                     v          v
Daughter    Son                 Each child   Each child
= CARRIER   = CLEAR             = 50%        = 50%
  (100%)     (0%)
```

- **Affected father** -> all daughters are carriers (1.0), all sons are unaffected (0.0)
- **Carrier mother** -> each child has 50% chance, adjusted by mother's own probability

### Pass 3: Male Sanitization

Males have a single X chromosome. They are either **affected** or **unaffected** — never silent carriers. This pass strips any carrier status from males while preserving their probability (which represents the chance they are affected).

```
Female (two X's)           Male (one X)
Can be:                    Can be:
 - Affected                 - Affected
 - Carrier (heterozygous)   - Unaffected
 - Unaffected               (NO carrier state)
```

### Pass 4: Origin Tracing

Walks the ancestor chain from each affected person to find the earliest carrier/affected ancestor:

```
Grandparent (carrier) <-- ORIGIN IDENTIFIED
     |
  Parent (carrier)
     |
  Proband (affected)
```

- If no carrier ancestor is found, the individual is flagged as a **spontaneous mutation**

## Pedigree Visualization

The tree follows standard genetic pedigree conventions:

### Symbols

| Shape | Meaning |
|-------|---------|
| Square | Male |
| Circle | Female |
| Filled | Affected (confirmed XLH) |
| Half-filled | Carrier (one mutated X) |
| Outline only | Unaffected |
| `?` inside | Unknown status |
| `%` inside | Computed probability |
| Orange dot | Spontaneous mutation |

### Color Coding

| Color | Status |
|-------|--------|
| Red `#E53E3E` | Affected (confirmed XLH) |
| Blue `#3182CE` | Unaffected |
| Gray `#A0AEC0` | Unknown |
| Pink `#ED64A6` | Carrier (probable) |
| Yellow `#ECC94B` | Carrier (possible) |
| Orange `#DD6B20` | Spontaneous mutation |

### Layout

```
Generation -2:   [Grandma]---[Grandpa]       [Grandma]---[Grandpa]
                        |                          |
Generation -1:   [Aunt] [Mother]----------[Father] [Uncle]
                              |
Generation  0:          [Proband]
                              |
Generation +1:   [Child]  [Child]  [Child]
```

- Generations are arranged in horizontal rows
- Spouse pairs are connected with horizontal lines
- Children are centered below their parents with a sibling bar connector
- Nodes are clickable for editing

## Getting Started

```bash
npm install
npm run dev
```

## Tech Stack

- **Vanilla JavaScript** (no framework)
- **Vite** for bundling and dev server
- **SVG** for tree rendering
- **localStorage** for persistence
