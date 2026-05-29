# Screen patterns — the two reusable step templates

Reviewing all of 2.0–6.0 (desktop + mobile, every state) shows the wizard steps collapse into
**two parameterized templates** + the unique summary. Build the template once, parameterize
per step. All render inside the wizard shell ([00-wizard-shell.md](00-wizard-shell.md)).

---

## Pattern A — "List step" (Steps 2, 3, 5)

A person-list builder. Same states + components across children / siblings / aunts-uncles;
only the **subject copy** and **tree placement** change.

### States
| State | What it is | Component |
|-------|-----------|-----------|
| landing | "Would you like to add your …?" YES / SKIP (+ optional note) | `DS-LANDING` |
| input | repeatable person entries (name, gender, XLH, + their children, + add another) | `DS-INPUTCARD` + `DS-PERSONFORMROW` |
| added | stacked collapsible rows, each with remove (−) + add/edit-their-children | `DS-PERSONFORMROW` ×n |
| their-children | overlay "Add [Name]'s children" — repeatable child mini-form, CANCEL/SAVE | `DS-NESTEDPERSONPOPUP` |
| review | same list; their-children button flips to "Edit their children" | `DS-PERSONFORMROW` (edit state) |

### Parameters per step
| Step | Subject (landing) | Add-another label | Tree placement | Nodes (landing · input · added · popup · review) — desktop/mobile |
|------|-------------------|-------------------|----------------|-------|
| **2 Children** | "add your children?" | "+ Add child" | child of proband couple | 1276:34003/34007 · 1276:35148/35232 · — · — · 1276:35424/1352:21055 |
| **3 Siblings** | "add your siblings?" | "+ Add sibling" | sibling of proband (proband gen) | 1421:14709/14710 · 1430:13560/13561 · 1434:15899/1519:21436 · 1439:14694/14695 · 1441:16129/16130 |
| **5 Aunts/Uncles** | "Does your [parent] have brothers or sisters?" + "biological relatives only" | "+ Add aunt or uncle" | sibling of the chosen parent | 1521:38667/38668 · 1521:41322/41323 · 1521:42589/1521:44356 · 1503:29462/1521:47363 · 1521:48444/1521:49167 |

### Logic
- Optional: SKIP advances with nobody added (`FLOW-2`). Subject copy uses `flow.subjectName()`.
- Each entry: First name (optional), Gender\*, XLH\* (Yes/No/Unsure). XLH ∈ {Yes,Unsure} reveals
  symptoms (`DM-7`, `DS-SYMPTOMS-SUMMARY`).
- "+ Add another" appends a `DS-PERSONFORMROW`; remove (−) hides when only one row remains.
- "+ Add their children" opens `DS-NESTEDPERSONPOPUP` (title binds to the person's name); SAVE
  writes nested children and flips the button to "Edit their children" (`DS-ADDEDIT` add↔edit).
- Step 5 subject = the parent chosen in Step 4 (maternal/paternal); children render a
  generation above siblings' children (cousins of the proband).

---

## Pattern B — "Chooser step" (Steps 4, 6)

Pick which relative on a side has/might have XLH, then capture their detail. Two sub-screens
(carousel dots): chooser → detail.

### States
| State | What it is | Component |
|-------|-----------|-----------|
| chooser | H4 question + 4-button group (2 CTA + 2 steel-outline) + (?) helper hint | `DS-CHOOSER` + `DS-HELPER-HINT` |
| detail | "Does your [relative] have XLH?" Yes / **Unsure** (no "No") + symptoms | `DS-INPUTCARD` + `DS-RADIO` + `DS-SYMPTOMS-SUMMARY` |

### Parameters per step
| Step | CTA options | Exit options | Question interpolation | Terminal? | Nodes (chooser · detail) desktop/mobile |
|------|-------------|--------------|------------------------|-----------|------|
| **4 Parent** | Mom · Dad | Neither · I don't know | (none) | no → Step 5 | 1441:19478/19479 · 1519:24388/24389 (review 1521:26172/1521:36624) |
| **4 Parent — male user** | Mom · **Dad disabled** | Neither · I don't know | (none) | — | 1773:19738/19739 (Dad disabled + `DS-TOOLTIP`) |
| **6 Grandparent** | Grandmother · Grandfather | Neither · I don't know | **maternal/paternal** (from Step 4) | yes → SUMMARY (FINISH) | 1475:17268/1521:52687 · 1521:50571/50572 (review 1475:22447/1475:22722) |

### Logic
- CTA (Mom/Dad/Grandmother/Grandfather) → reveals the detail form for that relative; sets the
  family side (`FLOW-5`/`FLOW-6`). **Neither / I don't know → end experience → SUMMARY** (`FLOW-8`).
- Detail offers **Yes / Unsure only** (`DM-2`; selected relative is the affected lineage, `INH-9`).
- **Disabled Dad (`FLOW-5a`):** male proband with XLH ∈ {Yes,Unsure} → Dad disabled
  (fill **`#949494`**) + hover `DS-TOOLTIP`: "This option isn't available. Males can only get
  XLH from their mom." (Button order also shifts in the male variant.)
- Step 6 question interpolates maternal (Mom chosen) / paternal (Dad chosen); Step 6 is the last
  building step so its primary button reads **FINISH**.

---

## New reusable components (added to the catalog in 08-design-system.md)
`DS-PERSONFORMROW` · `DS-NESTEDPERSONPOPUP` · `DS-CHOOSER` · `DS-HELPER-HINT` · `DS-TOOLTIP` ·
`DS-SYMPTOMS-SUMMARY` · `DS-CAROUSEL-DOTS` · (+ summary set in [07-summary.md](07-summary.md)).

## Flags (from live Figma)
- **`#949494`** is the disabled-button fill (`color/link/footer/disabled`), not `#c5c5c5`.
- Mobile "STEP 5 OF 6" frame `1521:49167` is mislabeled "STEP 1 OF 6" (Figma bug — ignore).
- Mobile counter reads "STEP n OF **6**" while the desktop stepper shows **7** nodes (6 input
  steps + the final tree) — intended, not a bug; just label the final node distinctly.
