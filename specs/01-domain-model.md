# 01 — Domain Model

Source: PDF p2–3, p11, p14; Figma component library (`Components` `1266:31249`).

## Enums

### `DM-1` Sex (gender assigned at birth)
`MALE` | `FEMALE`. Only these two; the field label in UI is "Gender assigned at birth".

### `DM-2` XLH answer (raw user input)
`YES` | `NO` | `UNSURE`. This is what the user picks for "Do you / they have XLH?".
For step-4/step-6 parent & grandparent selectors only `YES` | `UNSURE` are offered
(PDF p7, p10 — the affected-side question never offers "No").

### `DM-3` XLH result (computed for display)
`HAS_XLH` | `MAY_HAVE_XLH` | `NO_XLH`. Produced by the inheritance engine
([02-inheritance-logic.md](02-inheritance-logic.md)). Never set directly by the user.

### `DM-4` Relationship
`PROBAND` (the "you" / primary user) | `PARTNER` | `CHILD` | `SIBLING` |
`PARENT` | `AUNT_UNCLE` | `GRANDPARENT` | `COUSIN` (a sibling's or aunt/uncle's child) |
`NIBLING` (a sibling's child — niece/nephew).
Relationship is a **label** for display; genetic edges come from `parentIds`/`childIds`.

### `DM-5` Symptoms (PDF p3, p13 page 4)
A fixed catalog the user may attach to any person whose answer is `YES` or `UNSURE`.
Canonical groups & items (from the logic deck symptom list, PDF p13/p3):

- **Changes in growth and development** — shorter-than-average height; weakening of growing bones (rickets)
- **Bone weakness and broken bones** — weakening of mature bone (osteomalacia); broken bones (fractures) / areas of weakened bone that are not completely broken (pseudofractures)
- **Joint and tendon issues** — joint damage (osteoarthritis); hardening of tissue attaching bones and muscles (enthesopathy)
- **Leg and walking issues** — delayed walking or an unusual way of walking (gait abnormalities); bowed legs and knock knees
- **Pain, weakness, and fatigue** — bone and joint pain; muscle pain and weakness; fatigue
- **Head and spine complications** — unusual shape of the head (craniosynostosis); narrowing of spaces in the spine (spinal stenosis)
- **Dental issues** — abscesses and tooth loss; problems with the gums, like redness, swelling, or infection (periodontitis)
- **Hearing issues** — hearing loss

> The Step-1/2/etc. inline "Add symptoms" control shows a **short** checklist
> (PDF p3: "Changes in growth and development", "Bone weakness and broken bones",
> "Joint and tendon issues", "Leg and walking issues"); the full catalog above appears
> in the "(POP-UP) Full list of common XLH symptoms" (Figma 1.3 `1348:12938`) and PDF page 4.

## `DM-6` Person record

```js
{
  id: string,                 // stable unique id
  name: string,               // optional display name ("" allowed; tree shows relationship)
  sex: 'male' | 'female',     // DM-1
  answer: 'yes'|'no'|'unsure'|null,  // DM-2; null = not asked (e.g. partner not added)
  symptoms: string[],         // DM-5 ids; only meaningful when answer ∈ {yes, unsure}
  relationship: string,       // DM-4
  generation: number,         // 0 = proband/partner; -1 parents; -2 grandparents; +1 children; siblings share proband gen
  parentIds: string[],        // genetic parents (0–2)
  childIds: string[],
  spouseId: string | null,

  // engine output (DM-3, INH-*) — never user-set:
  result: 'has_xlh'|'may_have_xlh'|'no_xlh'|null,
  chance: number | null,      // 100 | 50 | 0 | null (null = "may have", unquantified)
}
```

### `DM-7` Symptoms gating
`symptoms` may be non-empty **only** when `answer ∈ {YES, UNSURE}`. Setting `answer`
to `NO` clears symptoms. (PDF p3-A: the Add-Symptoms field only appears for Yes/Unsure.)

## `DM-8` Store — 50-person hard limit
The tree supports at most **50** people (PDF p3-C). `store.canAddPerson()` is false at
50; an attempt to add beyond 50 is rejected and surfaces the "limit reached" state
(`FLOW-LIMIT`, UI `1657:17629`). Removing a person re-enables adding.

## `DM-9` Store queries
`getProband()`, `getPartner()`, `getChildren(id)`, `getParents(id)`, `getSiblings(id)`,
`getByRelationship(rel)`, `getByGeneration(n)`, `count()`, `getAll()`. Removing a person
cleans up all dangling `parentIds`/`childIds`/`spouseId` references.

## `DM-10` In-memory only — no persistence
The store holds state **in memory only**; there is no `localStorage`/`sessionStorage`/
cookie/IndexedDB persistence. A reload starts fresh; "Start over" clears the store. This is
required by the iframe-embedding context (`EMBED-2`) and the PII/PHI rule. (Supersedes the
current `FamilyStore` localStorage save/load, removed in Phase 3.)
