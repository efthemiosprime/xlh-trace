# XLH Family Tree Inheritance Tracker — Spec & Plan

## Context

Build a vanilla JS (Vite) app that lets users construct a family tree via a guided wizard, then analyzes X-linked inheritance patterns to identify the likely origin of XLH and each member's probability of being affected. The end result is an interactive, color-coded family tree visualization.

---

## Wizard Flow (6 Steps)

| Step | Label | Description |
|------|-------|-------------|
| 1 | Who is this for? | Enter the proband (primary person): name, sex, XLH status |
| 2 | Add Children | Add proband's children |
| 3 | Add a Parent | Add mother and/or father |
| 4 | Add Aunts & Uncles | Add siblings of parents |
| 5 | Add Grandparents | Add maternal/paternal grandparents |
| 6 | Your XLH Family Tree | Final interactive tree with inheritance analysis |

Progress bar: dots connected by lines (matching reference screenshot). Filled = complete, pulse = current, hollow = future.

---

## Node Types

Each person has a `relationship` type that determines their role in the tree:

| Type | Description | Added In Step |
|------|-------------|---------------|
| `proband` | The primary person the tree is built around | 1 |
| `child` | Children of the proband | 2 |
| `parent` | Mother / Father of the proband (sex pre-set) | 3 |
| `aunt_uncle` | Siblings of a parent | 4 |
| `grandparent` | Parents of a parent (sex pre-set) | 5 |
| `spouse` | Partner of any node (added contextually) | Any |

---

## Data Model

### Person Node

```js
{
  id: string,                    // crypto.randomUUID()
  name: string,
  sex: 'male' | 'female',
  xlhStatus: 'affected' | 'unaffected' | 'unknown',  // User-set
  computedStatus: string | null, // Engine-computed: 'carrier_probable', 'carrier_possible'
  probability: number | null,    // 0–1 chance of being affected/carrier
  relationship: string,          // One of the node types above
  generation: number,            // -2=grandparents, -1=parents, 0=proband, +1=children
  parentIds: string[],           // [motherId, fatherId]
  childIds: string[],
  spouseId: string | null,
  isSpontaneous: boolean         // Flagged by engine if no parent is carrier
}
```

### FamilyStore (singleton, pub/sub)

- **CRUD:** `addPerson()`, `updatePerson()`, `removePerson()`, `getPerson()`
- **Queries:** `getProband()`, `getChildren(id)`, `getParents(id)`, `getSiblings(id)`, `getByGeneration(n)`, `getAll()`
- **Relationships:** `setParentChild()`, `setSpouse()`
- **Persistence:** `toJSON()` / `fromJSON()` (localStorage)
- **Events:** `subscribe(listener)` / `#notify(event, data)`

---

## Inheritance Engine

### XLH Rules (X-linked dominant)

- **Father affected** → 100% daughters inherit, 0% sons
- **Mother affected** → 50% each child (son or daughter)
- **20–30% spontaneous** — no parent is carrier

### Algorithm (3 passes)

**Pass 1 — Backward inference (bottom-up):**
- Affected male → mother MUST be carrier (probability 1.0)
- Affected female → at least one parent must be affected/carrier
- Propagate upward through grandparents

**Pass 2 — Forward inference (top-down):**
- Affected father → all daughters are carriers (1.0), sons unaffected (0.0)
- Affected/carrier mother → each child 50% chance (0.5)

**Pass 3 — Origin tracing:**
- Walk ancestor chain from each affected person
- Earliest affected/carrier ancestor = origin
- No carrier ancestors found = spontaneous mutation

---

## File Structure

```
src/
├── main.js                         # Bootstrap App
├── style.css                       # Global styles, CSS custom properties
├── data/
│   ├── constants.js                # Enums: SEX, XLH_STATUS, RELATIONSHIP, STEPS
│   └── FamilyStore.js              # Singleton store with pub/sub
├── engine/
│   ├── InheritanceEngine.js        # Backward/forward inference, probability calc
│   └── TreeAnalyzer.js             # Origin tracing, report generation
├── components/
│   ├── App.js                      # Root: header + ProgressBar + WizardContainer
│   ├── ProgressBar.js              # Dots-and-lines step indicator
│   ├── wizard/
│   │   ├── WizardContainer.js      # Step navigation, prev/next, validation
│   │   ├── StepProband.js          # Step 1
│   │   ├── StepChildren.js         # Step 2
│   │   ├── StepParents.js          # Step 3
│   │   ├── StepAuntsUncles.js      # Step 4
│   │   ├── StepGrandparents.js     # Step 5
│   │   └── StepTreeView.js         # Step 6 — final tree + analysis
│   ├── shared/
│   │   ├── PersonForm.js           # Reusable form (name, sex, XLH status)
│   │   ├── PersonCard.js           # Compact person display
│   │   ├── PersonList.js           # List with add/remove
│   │   └── Modal.js                # Edit modal
│   └── tree/
│       ├── TreeRenderer.js         # SVG layout engine
│       ├── TreeNode.js             # Node rendering (square=male, circle=female)
│       ├── TreeConnectors.js       # Lines: spouse, parent-child, sibling bar
│       └── TreeLegend.js           # Color legend
└── utils/
    ├── dom.js                      # createElement, $, $$ helpers
    ├── events.js                   # EventBus pub/sub
    └── id.js                       # generateId()
```

---

## UI Design

### Color Coding

| Status | Color | CSS Variable |
|--------|-------|-------------|
| Affected (confirmed XLH) | Red `#E53E3E` | `--color-affected` |
| Unaffected | Blue `#3182CE` | `--color-unaffected` |
| Unknown | Gray `#A0AEC0` | `--color-unknown` |
| Carrier (probable) | Pink `#ED64A6` | `--color-carrier-probable` |
| Carrier (possible) | Yellow `#ECC94B` | `--color-carrier-possible` |
| Spontaneous mutation | Orange `#DD6B20` | `--color-spontaneous` |

### Pedigree Conventions

- **Male** = square, **Female** = circle
- Filled = affected, half-filled = carrier, outline = unaffected, `?` = unknown

### Tree Layout (SVG)

- Rows by generation: grandparents (top) → parents → proband → children (bottom)
- Spouse pairs side-by-side with horizontal line
- Children centered below parents with vertical + horizontal bar connector
- Nodes clickable to edit/add/remove
- `viewBox` scaling + horizontal scroll for wide trees

---

## Implementation Order

### Phase 1: Foundation
1. `utils/id.js`, `utils/dom.js`, `utils/events.js`
2. `data/constants.js`
3. `data/FamilyStore.js`
4. Rewrite `style.css` (reset, tokens, typography)
5. Update `index.html` (title, meta)

### Phase 2: Shared Components
1. `shared/PersonForm.js`
2. `shared/PersonCard.js`
3. `shared/PersonList.js`
4. `shared/Modal.js`

### Phase 3: Wizard Shell
1. `ProgressBar.js`
2. `wizard/WizardContainer.js`
3. `App.js`
4. Rewrite `main.js`, delete `counter.js` + `javascript.svg`

### Phase 4: Wizard Steps 1–5
1. `StepProband.js`
2. `StepChildren.js`
3. `StepParents.js`
4. `StepAuntsUncles.js`
5. `StepGrandparents.js`

### Phase 5: Inheritance Engine
1. `InheritanceEngine.js` (backward + forward inference)
2. `TreeAnalyzer.js` (origin tracing, report)

### Phase 6: Tree Visualization
1. `TreeNode.js`
2. `TreeConnectors.js`
3. `TreeRenderer.js` (layout algorithm)
4. `TreeLegend.js`

### Phase 7: Final Step
1. `StepTreeView.js` — combines tree + analysis panel + interactive editing

### Phase 8: Polish
1. localStorage persistence
2. Responsive CSS (mobile stacks vertically)
3. Keyboard navigation
4. Accessibility (ARIA labels, focus management)

---

## Verification

1. `npm run dev` — app loads with wizard at step 1
2. Walk through all 6 steps, adding family members at each
3. Verify tree renders correctly with proper generation rows and connectors
4. Test inheritance scenarios:
   - Affected father → all daughters carrier, sons clear
   - Affected mother → 50% each child
   - Affected child, unknown parents → backward inference marks mother as carrier
   - No affected ancestor → spontaneous mutation flag
5. Edit/remove nodes on tree view and verify re-analysis
6. Refresh page → data persists from localStorage
