# Component Catalog — authoritative mapping (variants × states)

The single source of truth for **every** UI component: its **variants**, **states**, where
it's **used**, its **Figma** node(s), and the planned **CSS class / JS factory**. Deduped
from the full desktop+mobile review of screens 0.0–7.0. Tokens + geometry live in
[08-design-system.md](08-design-system.md); screen flows in [screens/](screens/README.md).

Status: ✅ built · 📝 spec'd · ⬜ todo.

## Master matrix

| ID | Component | Variants | States | Used in | CSS / factory | Status |
|----|-----------|----------|--------|---------|---------------|--------|
| C-SHELL | App shell | — | — | all | `.page` + `.app-shell` | ✅ |
| C-STEPS | Step indicator | desktop 7-node · mobile lime-bar | node: current / visited / future; mobile: + VIEW TREE toggle | shell (1–7) | `createStepper` | ⬜ |
| C-DOTS | Carousel sub-step dots | n dots | active / inactive | steps 2–6 cards | `.ds-dots` | ⬜ |
| C-BTN | Button | cta · steel-outline · magenta-outline; size lg/md | default · hover · pressed · focus · disabled (`#949494`) · selected | everywhere | `.ds-btn` (+ mods) | ✅(base) |
| C-ADDEDIT | Add/Edit tool button | add (+) · edit (pencil) | default · hover · focus | list steps, tree | `.ds-addedit` | ⬜ |
| C-INPUT | Text field | text · email | empty/placeholder · filled · focus · disabled · error | 1,2,3,5,7, partner | `.ds-input` | ⬜ |
| C-RADIO | Radio + label group | gender (M/F) · xlh (Yes/No/Unsure) · xlh-parent (Yes/Unsure) | default · selected · focus · disabled | 1–6 | `.ds-radio` / `createRadioGroup` | ⬜ |
| C-SYMPTOMS | Symptoms picker | summary-trigger ("N selected") · expanded checklist · reference popup | hidden(gated) · collapsed · expanded · item checked/unchecked | 1,2,3,4,5,6 | `createSymptomsField` | ⬜ |
| C-INPUTCARD | Input card (form surface) | A · B · C · D · E (Figma) | — | 1–6 | `.ds-card` | ✅(base) |
| C-LANDING | Landing question card | Landing A · B · Last | — | 2,3,5 | `createLandingCard` | ⬜ |
| C-CHOOSER | Relative chooser | parent · grandparent | option: default / selected / **disabled (Dad)** | 4,6 | `createChooser` | ⬜ |
| C-HINT | Helper hint ((?) + copy) | — | — | 4,6 | `.ds-hint` | ⬜ |
| C-TOOLTIP | Button tip bubble | pointer up/down/right | hidden · shown (hover/focus) | 4 (disabled Dad) | `createTooltip` | ⬜ |
| C-PERSONROW | Repeatable person entry | — | collapsed/expanded · single (no remove) / multi (remove −) · w/ symptoms · add↔edit-children | 2,3,5 | `createPersonFormRow` | ⬜ |
| C-MODAL | Dialog (overlay + card) | see specializations ↓ | open · closed | 1,3,5,7, limit | `createModal` (base) | ⬜ |
| C-PERSONICON | Pedigree person icon | male/female × {no, may, has} = 6 | — | tree everywhere | SVG asset / `personIcon()` | ⬜ |
| C-CHROMO | Chromosome chips | XX · XY | per-chromosome highlight on/off | profile popup, PDF | `chromoChips()` | ⬜ |
| C-TREENODE | Interactive tree node | — | default · hover · focus · selected (popup open) | summary tree | `createTreeNode` | ⬜ |
| C-TREE | Pedigree tree | preview (wizard) · result (summary) | — | shell preview, 7 | `createTreePreview` / `createTree` | 🔁 (reuse old renderer) |
| C-LEGEND | Status + chromosome legend | — | — | shell, 7, PDF | `.ds-legend` | ⬜ |

### C-MODAL specializations (one base, parameterized)
| ID | Modal | Title | Body | Footer | Figma |
|----|-------|-------|------|--------|-------|
| C-MODAL-SYMPTOMS | Symptoms reference | "Not everyone experiences XLH the same way" | 8-group catalog (2-col/1-col) | ✕ | 1.3 `1348:12938/12939` |
| C-MODAL-PARTNER | Add partner/spouse | "Add your partner/spouse" | name + gender + "Does he/she have XLH?" (+symptoms) | CANCEL / SAVE | 1.4 `1348:12079/12080` |
| C-MODAL-NESTED | Add [Name]'s children | dynamic, binds person name | repeatable child mini-form + "+ Add child" | CANCEL / SAVE | 3.4 `1439:14694/14695`, 5.4 `1503:29462/1521:47363` |
| C-MODAL-LIMIT | Limit reached | "You have reached the maximum limit" | 50-person message | CLOSE | `1657:31234` |
| C-MODAL-PROFILE | Profile detail | lime name + chromosomes | relationship/status + Symptoms list + mini-legend | ✕ | 7.1 `2005:15277` (dark steel variant) |
| C-MODAL-CONFIRM | Reset confirm | "Start over?" | "Your data will not be saved." | CANCEL / YES | 7.2 `1489:20975` / `1521:54464` |
| C-MODAL-EMAIL | Enter email | "Enter your email address" | email input | CANCEL / SUBMIT | 7.3 `1489:23383` / `1521:55772` |
| C-MODAL-EMAILSENT | Email sent | "Email sent!" | echoed address | CLOSE | 7.4 `1493:26326` / `1521:56192` |

> All C-MODAL-* share base behavior: scrim + centered card, `role="dialog" aria-modal`, focus
> trap, `Esc`, focus restore (`A11Y-6`). `C-MODAL-PROFILE` is the dark-steel variant; the rest
> are snow cards. `C-MODAL-CONFIRM/EMAIL/EMAILSENT` are the `DS-ACTION-DIALOG` family
> (title + body + optional input + 1–2 buttons).

## Detail — components with non-obvious variants/states

### C-BTN (Button) — the canonical mapping
- **cta** (solid magenta `#ad0b49` / snow text): NEXT, YES, SAVE, SUBMIT, MOM, DAD,
  GRANDMOTHER, GRANDFATHER, DOWNLOAD & PRINT, SEND VIA EMAIL.
- **steel-outline** (`#f6f6f6` bg / steel border+text): NEITHER, I DON'T KNOW, START OVER,
  + Add (spouse/child/sibling/aunt-uncle/their-children).
- **magenta-outline** (white / magenta border+text): GO BACK, CANCEL, CLOSE; **SKIP** = _confirm_.
- States: default · hover · pressed · `:focus-visible` ring · **disabled `#949494`** ·
  **selected** (chooser option = cta look). Sizes lg (16) / md (14).

### C-RADIO — groups & option set
- **gender**: Male / Female. **xlh**: Yes / No / Unsure. **xlh-parent** (steps 4 & 6 detail):
  Yes / Unsure only (no "No"). Wrap each group in `<fieldset><legend>` (`A11Y-3`).

### C-SYMPTOMS — three faces of one picker
1. **summary-trigger** — collapsed select "N symptoms selected" + chevron + `(?)` (most steps).
2. **expanded checklist** — inline checkboxes (short list).
3. **reference popup** — full 8-group catalog (C-MODAL-SYMPTOMS), opened by `(?)`.
- **Reveal-gated**: shown only when that person's XLH ∈ {Yes, Unsure} (`DM-7`). Setting No clears.

### C-CHOOSER — option states
2 cta options + 2 steel-outline exits. Option states: default / **selected** (becomes cta) /
**disabled** (Dad for male proband, `#949494`, + C-TOOLTIP). Desktop = 2-up row; mobile = stacked.

### C-PERSONROW — the repeatable entry (steps 2/3/5)
Header (First name + collapse −/＋) · name input · gender radios · xlh radios · gated symptoms ·
secondary action (+ Add their children ↔ Edit their children). **Remove (−) hides when one row
remains.** This unifies the agents' `DS-CHILD-ENTRY` and `DS-PERSONFORMROW` proposals → **one**
component.

### C-PERSONICON — 6 variants
{Male, Female} × {No XLH = outline, May have = half-lime, Has = full-lime}. Male highlights its
single X (`UI-ICON`, PDF p12). Export from Figma (asset) rather than hand-draw for production.

## Reconciliations / corrections (from live Figma)
- **Disabled fill = `#949494`** (`color/link/footer/disabled`) — supersedes the `#c5c5c5`
  used earlier; update `--color-disabled` usage for buttons.
- **Status display**: UI (tree + C-MODAL-PROFILE) shows **categorical** (No/May/Has) only; the
  **percentage** lives in the **PDF table** (`PDF-2`). `INH-11` keeps `chance`; render
  categorical in UI, categorical + % in PDF.
- Naming unified: agent names `DS-CHILD-ENTRY`→**C-PERSONROW**; `DS-NESTEDPERSONPOPUP`→
  **C-MODAL-NESTED**; `DS-PROFILE-POPUP`→**C-MODAL-PROFILE**; confirm/email dialogs→
  **C-MODAL-CONFIRM/EMAIL/EMAILSENT** (DS-ACTION-DIALOG family).

## Build implication
Phase 4 = the shell + this catalog. Build each component **once** (factory + isolated SCSS
partial under `src/styles/components/`), then compose screens via the two patterns
([screens/patterns.md](screens/patterns.md)) + the summary. A component is "done" when it
covers all variants/states above and passes its a11y checks.
