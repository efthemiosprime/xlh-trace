# 03 — Wizard Flow State Machine

Sources: PDF p2 (step strip), p3–p11 (per-step logic), Figma frames 0.0–7.0.

A **pure** state machine drives step order, side-of-family focus, option gating, and
end-of-experience exits. No DOM. Module: `src/wizard/WizardFlow.js`. The UI renders
whatever the machine reports; the store holds the people.

## Steps (PDF p2)

| Index | Id | Title | Optional? | Source |
|-------|----|-------|-----------|--------|
| 0 | `START` | Start screen | – | Figma 0.0 |
| 1 | `SELF` | Tell us about yourself | no | p3–p4 |
| 2 | `CHILDREN` | Add children | yes (Skip) | p5 |
| 3 | `SIBLINGS` | Add siblings | yes (Skip) | p6 |
| 4 | `PARENT` | Add a parent | special (see FLOW-5) | p7–p8 |
| 5 | `AUNTS_UNCLES` | Add aunts & uncles | yes (Skip) | p9 |
| 6 | `GRANDPARENTS` | Add grandparents | special (see FLOW-6) | p10 |
| 7 | `SUMMARY` | Your family tree | – (terminal) | p11 |

### `FLOW-1` Linear advance / back
`next()` advances to the next step; `back()` returns to the previous step. `back()` from
`SELF` is a no-op (or returns to `START`). Steps marked optional expose `skip()` which is
equivalent to `next()` with no person added.

### `FLOW-2` Optional steps
`CHILDREN`, `SIBLINGS`, `AUNTS_UNCLES` present a landing screen ("Would you like to add
your …?") with **Yes** / **Skip** (Figma 2.1/3.1/5.1). Skipping adds nobody and advances.

## Family-side focus

### `FLOW-3` Partner-side shift (PDF p4)
Determined after `SELF`. If the proband answers **No** to "Do you have XLH?" **and** a
partner is added whose answer is **Yes** or **Unsure**, the tree builds out the
**partner's** side: `focusPerson = PARTNER`. Otherwise `focusPerson = SELF`.
When `focusPerson = PARTNER`, question labels interpolate the partner's name
("Add [Partner]'s siblings", "Does [Partner]'s mom have XLH?", etc.).

### `FLOW-4` Lineage label
`subjectName()` returns the focus person's name (or "you"/"your" phrasing when SELF).
Used to template every step's copy.

## Step 4 — Add a parent (PDF p7, p8)

### `FLOW-5` Parent selector options
Step `PARENT` is a chooser with four options: **Mom**, **Dad**, **Neither**,
**I don't know**. Only `YES`/`UNSURE` are askable about the chosen parent (p7).
- `selectParent('mom')` → proband's affected side is **maternal**; advance to detail then continue.
- `selectParent('dad')` → affected side is **paternal**.
- `selectParent('neither')` or `selectParent('idk')` → **end the experience**: jump
  straight to `SUMMARY` (`FLOW-8`). No grandparents step.

### `FLOW-5a` Disabled "Dad" for male focus person (PDF p8)
If the focus person is **male** and their answer is **Yes** or **Unsure**, the **Dad**
option is **disabled** (males inherit XLH only from their mother). `canSelectParent('dad')`
returns false; UI shows tooltip "This option isn't available. Males can only get XLH from
their mom." The user must pick Mom, Neither, or I don't know.

### `FLOW-5b` Selected parent is affected
The chosen parent is created with `answer` from the Yes/Unsure question and (per `INH-9`)
seeds the lineage's affected status.

## Step 6 — Add grandparents (PDF p10)

### `FLOW-6` Grandparent selector & side
Step `GRANDPARENTS` mirrors step 4: **Grandmother**, **Grandfather**, **Neither**,
**I don't know**; only `YES`/`UNSURE` askable.
- The grandparent side is **maternal** if Mom was chosen in step 4, **paternal** if Dad.
  `grandparentSide()` → `'maternal' | 'paternal'`. Question reads "Which of your
  [maternal|paternal] grandparents has or might have XLH?".
- `neither` / `idk` → end the experience (`FLOW-8`); since `GRANDPARENTS` is the last
  building step this simply advances to `SUMMARY`.

### `FLOW-6a` Grandparents step only reachable via a chosen parent
If step 4 ended the experience (Neither/IDK), `GRANDPARENTS` is never shown.

## End of experience

### `FLOW-8` `end()` → SUMMARY
`Neither`/`I don't know` at step 4 or 6 sets `isEnded = true` and `currentStep = SUMMARY`.
`SUMMARY` is terminal: `next()` is a no-op.

## 50-person limit

### `FLOW-LIMIT` (PDF p3-C, Figma `1657:17629`)
Before any "add person" action the flow checks `store.canAddPerson()` (`DM-8`). At 50
people the add is blocked and the machine reports `limitReached = true`, which the UI
renders as the "You have reached the maximum limit" overlay with a single **Close**
action. The user may still proceed to `SUMMARY` or remove members; removing drops
`limitReached` back to false.

## Secondary actions (overlays)

### `FLOW-9` Per-step secondary actions (PDF p3-B; Figma overlays)
- `SELF`: "Add spouse/partner" (1.4/1.5) — opening it is what enables `FLOW-3`.
- `CHILDREN`: "Add another child".
- `SIBLINGS`: "Add another sibling"; "Add [sibling]'s children" overlay (3.4).
- `AUNTS_UNCLES`: "Add another aunt or uncle"; "Add their children" overlay (5.4).
These mutate the store; they do not change `currentStep`.
