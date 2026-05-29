# Screen impl — Step 1: Tell us about yourself (Figma 1.0)

The proband entry step. Renders inside the wizard shell ([00-wizard-shell.md](00-wizard-shell.md)).
Figma: desktop symbols + mobile instances per state.

| State | Desktop | Mobile | What it is |
|-------|---------|--------|------------|
| 1.1 form | `1266:17513` | `1266:17514` | empty form |
| 1.2 symptoms reveal | `1266:18125` | `1266:18294` | XLH=Yes/Unsure → symptoms checklist; tree turns green |
| 1.3 symptoms popup | `1348:12938` | `1348:12939` | full 8-group symptom reference overlay |
| 1.4 add partner popup | `1348:12079` | `1348:12080` | partner sub-form overlay |
| 1.5 / 1.6 review | `1266:19835` | `1266:19836` | symptoms collapsed; "Edit spouse/partner"; tree shows you + spouse |

## Form fields
- **First name** — text, **optional** (no `*`). Placeholder "Enter name".
- **Gender assigned at birth\*** — radios Male / Female (`DM-1`). Required.
- **Do you have XLH?\*** — radios **Yes / No / Unsure** (`DM-2`). Required.
- **Add symptoms** — appears only when XLH ∈ {Yes, Unsure} (`DM-7`). Multi-select
  "Select all that apply" checklist (short list inline; `DS-SYMPTOMS`). A `(?)` opens the
  full reference popup (1.3). Selected count collapses to "N symptoms selected".
- **Add spouse/partner** — steel-outline button opens the partner popup (1.4). After save it
  becomes **Edit spouse/partner** (edit-tool icon).

## Behavior / logic
- **Validation / NEXT gate:** advance only when Gender + XLH are answered (name optional).
  Creates/updates the proband (`relationship: PROBAND`, `generation: 0`).
- **Symptoms reveal/clear:** toggling XLH to `No` hides + clears symptoms (`DM-7`).
- **Symptoms popup (1.3):** informational reference only (read-only catalog, `DM-5`);
  selecting happens in the inline checklist. Dialog semantics (`A11Y-6`).
- **Partner popup (1.4):** First name, Gender\*, "Does he/she have XLH?\*" (Yes/No/Unsure);
  CANCEL / SAVE. On save, creates a `PARTNER` (spouse of proband). If the partner's XLH ∈
  {Yes, Unsure} → its own symptoms field applies (same `DM-7`).
- **Partner-side shift (`FLOW-3`):** if proband answers **No** and partner ∈ {Yes, Unsure},
  `flow.focusPerson = PARTNER`; later step copy interpolates the partner's name.
- **Live tree preview:** every change recomputes via `StatusEngine` (`INH-1`: Yes→Has 100,
  No→No 0, Unsure→May-have) and re-renders the preview node(s): proband, + spouse once added,
  linked by a spouse line. Desktop = right pane; mobile = VIEW TREE toggle.

## Components
`DS-SHELL` (container) · `DS-STEPS` (stepper, step 1 active) · `DS-INPUTCARD` (the form card,
lime border) · `DS-INPUT` (name) · `DS-RADIO` (gender, XLH) · `DS-SYMPTOMS` (checklist) ·
`DS-BUTTON` steel-outline (`+ Add spouse/partner` / edit) + CTA (`NEXT`, `SAVE`) +
magenta-outline (`CANCEL`) · `DS-POPUP` (1.3 reference, 1.4 partner) · `DS-PERSONICON` +
`DS-LEGEND` (tree preview).

## Build (factories, R2)
- `createStepSelf(slot, { store, flow })` → renders the form into the shell's content slot;
  reads/writes the proband in `store`; exposes `isValid()`; returns `destroy()`.
- `createSymptomsField(mount, { person, store })` → the reveal-gated checklist.
- `createSymptomsReferenceModal(mount, { onClose })` → 1.3 dialog.
- `createPartnerModal(mount, { store, flow, onClose })` → 1.4 dialog; sets spouse + triggers
  `FLOW-3` evaluation on save.

## Accessibility (`A11Y-*`)
- `<h1>` "Provide your details"; eyebrow is not a heading. Radio groups in
  `<fieldset><legend>` ("Gender assigned at birth", "Do you have XLH?"). Name `<label>`.
- `(?)` is a `<button aria-label="View common XLH symptoms">`; popups are
  `role="dialog" aria-modal` with focus trap, `Esc`, focus restore (`A11Y-6`).
- Symptoms is an accessible multi-select (checkboxes in a labelled group).
- NEXT `disabled` mirrors `isValid()`; tree preview node has name+status text (`A11Y-10`).

## Tests
- Flow/logic (node): Yes/Unsure reveals symptoms; No clears; NEXT gated; partner save sets
  spouse + `FLOW-3` shift when proband=No & partner∈{Yes,Unsure}; proband status via engine.
- UI (jsdom + testing-library): field labels/required, radio fieldsets, symptoms toggle,
  popup open/close + focus restore, edit-partner relabel.
- E2E (Playwright): fill → tree preview turns green; desktop two-column vs mobile VIEW TREE.
