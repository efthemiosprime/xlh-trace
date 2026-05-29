# 02 — Inheritance / Status-Percentage Engine

Sources: PDF p11 (tree), **p12 (chromosome inheritance diagram)**, **p14 (table)**,
**p15 (percentage calculation chart)**, and X-linked dominant genetics.

The engine is a **pure function**: `computeStatuses(people) → people` where each person
gets a `{ result, chance }`. No DOM, no store, no I/O. Module: `src/engine/StatusEngine.js`.

## Genetic ground rules (PDF p12)

XLH is **X-linked dominant**. Female = `XX`, Male = `XY`.

- **Affected father × unaffected mother:** every **daughter** inherits his X → **100%**;
  every **son** gets his Y → **0%**.
- **Affected mother × unaffected father:** each child (son or daughter) → **50%**.
- A **male** can only inherit XLH from his **mother** (his X is maternal). (PDF p8, p12.)

## Resolving the p14 vs p15 ambiguity

PDF p15 says percentages are "only calculated for direct offspring from users who
answered 'Yes'". Taken literally that contradicts p14, where **Maria (an aunt) shows 50%**
and **Eric (a cousin) shows "May have XLH" with no %**. Reverse-engineering every cell of
the p14 table yields one consistent rule set (below) that reproduces all of:
Amy=Has(100), Alex=No, David=MayHave(50), Emily=No(0), Jake/Alyssa=No, Mom=Has(100),
Maria=MayHave(50), Eric=MayHave(—), Michelle=No.

**The generalization we adopt:** a percentage is computed for the **direct offspring of any
person who `HAS_XLH`** (not only the proband). A person who merely `MAY_HAVE_XLH` does *not*
propagate a number to their children. The user's own answer always wins over inference.

## Rules

### `INH-1` Own answer wins
- `answer == YES` → `{ result: HAS_XLH, chance: 100 }`.
- `answer == NO`  → `{ result: NO_XLH,  chance: 0 }`.
These are never overridden by inference. (p14: Emily answered No → No XLH even though her
mother Amy Has XLH; Jake/Alyssa siblings answered No → No XLH.)

### `INH-2` Inference applies only to `UNSURE` (or unanswered)
A person with `answer == UNSURE` (or `null`) gets `result`/`chance` inferred from parents
per INH-3..INH-7. Resolved top-down (a parent's result is computed before its children).

### `INH-3` Affected father → daughters
Unsure **female** whose **father** `HAS_XLH` → `{ HAS_XLH, 100 }`.
(She must inherit his only X.)

### `INH-4` Affected father → sons
Unsure **male** whose father `HAS_XLH` but whose mother does **not** `HAS_XLH`
→ `{ NO_XLH, 0 }`. (Sons get the Y; father is genetically irrelevant to a son.)

### `INH-5` Affected mother → any child
Unsure child (male or female) whose **mother** `HAS_XLH` → `{ MAY_HAVE_XLH, 50 }`,
**unless** a stronger rule applies:
- a daughter who also has an affected father is `HAS_XLH/100` (INH-3 wins);
- a son's status depends only on the mother here → `50`.
(p14: David, Maria are children of a Has-XLH mother → 50.)

### `INH-6` Uncertain parent does not quantify
Unsure person with **no** `HAS_XLH` parent, but **at least one** `MAY_HAVE_XLH` parent
→ `{ MAY_HAVE_XLH, null }` (qualitative "May have XLH", no percentage).
(p14: Eric is the child of Maria who only *may have* XLH → "May have XLH", no %.)

### `INH-7` No affected lineage
Unsure person with no `HAS_XLH` and no `MAY_HAVE_XLH` parent → `{ MAY_HAVE_XLH, null }`
(they are unsure about themselves with nothing to refine it).
An **unanswered** (`null`) person with no affected lineage → `{ NO_XLH, 0 }`
(absence of information defaults to No XLH for display, per p14 relatives shown "No XLH").

### `INH-8` Males are never partial
A male is only ever `HAS_XLH (100)` or `NO_XLH (0)` from confirmed inheritance — he is
never a "carrier". The single quantified-but-uncertain male case is `MAY_HAVE_XLH (null)`
(qualitative), never `50`. A male's father never affects his status (INH-4).

### `INH-9` Selected affected parent/grandparent = HAS_XLH
When the user picks Mom/Dad (step 4) or a grandparent (step 6) as the one who "has or
might have XLH" and answers **Yes**, that person is seeded `answer = YES` → `HAS_XLH`,
which then drives INH-3..INH-5 for the lineage. Answering **Unsure** there seeds
`UNSURE` → that ancestor is `MAY_HAVE_XLH (null)` and only propagates per INH-6.

### `INH-10` Determinism & idempotence
`computeStatuses` is pure and idempotent: running it twice on the same input yields
identical results, and it must not depend on people array ordering.

## Truth table (reproduces PDF p14)

| Person | sex | answer | mother result | father result | → result | chance | Rule |
|--------|-----|--------|---------------|---------------|----------|--------|------|
| Amy (proband) | F | YES | – | – | HAS_XLH | 100 | INH-1 |
| Alex (partner)| M | NO  | – | – | NO_XLH | 0 | INH-1 |
| David (child) | M | UNSURE | HAS_XLH (Amy) | NO_XLH (Alex) | MAY_HAVE_XLH | 50 | INH-5 |
| Emily (child) | F | NO | HAS_XLH | NO_XLH | NO_XLH | 0 | INH-1 |
| Mom | F | YES | – | – | HAS_XLH | 100 | INH-1/INH-9 |
| Maria (aunt) | F | UNSURE | HAS_XLH (Grandmother) | – | MAY_HAVE_XLH | 50 | INH-5 |
| Eric (cousin) | M | UNSURE | MAY_HAVE_XLH (Maria) | – | MAY_HAVE_XLH | null | INH-6 |
| Jake (sibling)| M | NO | HAS_XLH (Mom) | – | NO_XLH | 0 | INH-1 |
| daughter of affected father | F | UNSURE | NO_XLH | HAS_XLH | HAS_XLH | 100 | INH-3 |
| son of affected father only | M | UNSURE | NO_XLH | HAS_XLH | NO_XLH | 0 | INH-4 |
| son of affected mother+father | M | UNSURE | HAS_XLH | HAS_XLH | MAY_HAVE_XLH | 50 | INH-5 |

## `INH-11` Display strings
- `HAS_XLH` → "Has XLH" (with "(100%)" when chance==100).
- `MAY_HAVE_XLH` + chance==50 → "May have XLH (50% chance)".
- `MAY_HAVE_XLH` + chance==null → "May have XLH".
- `NO_XLH` → "No XLH" (with "(0% chance)" when chance==0 was inferred for an offspring).
All carry the disclaimer asterisk: "Calculated based on user response. Not a formal diagnosis." (p14).
