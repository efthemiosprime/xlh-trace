# Screen impl — Step 7: Summary / Your XLH Family Tree (Figma 7.0)

The terminal screen: the finished interactive pedigree + actions. Renders in the shell
(stepper all complete, step 7 active). The richest screen — several unique components.

| State | Desktop | Mobile | What it is |
|-------|---------|--------|------------|
| 7.1 summary (resting) | `1542:14021` | (stacks; no standalone frame⚠) | intro/actions + interactive tree + legend + disclaimer |
| 7.1 + profile popup | `1833:41100` | — | person detail card over the tree |
| 7.2 reset confirm | `1489:20975` | `1521:54464` | "Start over? Your data will not be saved." CANCEL / YES |
| 7.3 enter email | `1489:23383` | `1521:55772` | email input; CANCEL / SUBMIT |
| 7.4 email sent | `1493:26326` | `1521:56192` | "Email sent!" + echoed address; CLOSE |

⚠ No standalone mobile summary frame exists in Figma; mobile stacks **intro → tree → actions**
vertically (the popups are the only mobile-rendered 7.x frames). Confirm layout with design.

## Layout
- **Desktop**: two columns — LEFT `DS-SUMMARY-INTRO` ("[Name]'s XLH Family Tree" + guidance +
  `DS-SUMMARY-ACTIONS` + disclaimer); RIGHT the interactive `DS-TREE` + "Click a profile to view
  a larger breakdown" hint + `DS-LEGEND`. Consent footer full-width.
- **Mobile**: intro + actions, then the tree, stacked.

## Components (new ones flagged)
- `DS-SUMMARY-INTRO` (`2005:15051`) — heading (magenta name + steel "XLH FAMILY TREE", `h5`),
  guidance copy, bold "Download…" line; hosts the action stack.
- `DS-SUMMARY-ACTIONS` (`2005:15058`) — vertical stack: **Download & print** (CTA + download
  icon) · **Send via email** (CTA + envelope) · **Start over** (steel-outline) + disclaimer.
- `DS-INTERACTIVE-TREE-NODE` — each tree person is the clickable unit → opens the profile popup.
- `DS-PROFILE-POPUP` (`2005:15277`) — **dark steel** card: **lime name** + `DS-CHROMO` chips
  (XX/XY, XLH-bearing one lime), relationship + **status line** (No / May have / Has XLH),
  **Symptoms:** bulleted list, mini chromosome legend, close ✕.
- `DS-ACTION-DIALOG` (`DS-POPUP` specialization) — one parameterized dialog (title, body,
  optional input, 1–2 pill buttons) covering 7.2 confirm, 7.3 email, 7.4 confirmation.
- Reused: `DS-SHELL`, `DS-STEPS` (all complete), `DS-BUTTON` (CTA / magenta-outline),
  `DS-INPUT` (email), `DS-TREE`, `DS-PERSONICON`, `DS-CHROMO`, `DS-LEGEND`.

## Logic
- **Click a person → `DS-PROFILE-POPUP`** anchored near the node: name, chromosomes (male X
  highlighted, `UI-ICON`), computed status (`INH-*`), symptom list. ✕ closes.
- **Download & print** → 4-page PDF (`PDF-1..6`). **Send via email** → 7.3 → SUBMIT → 7.4
  (echo address) → CLOSE; CANCEL dismisses. **Start over** → 7.2 → YES clears the in-memory
  store (`DM-10`) and restarts; CANCEL dismisses. **EXIT** leaves the tool.
- Reached when the flow ends (last step FINISH, or Neither/IDK at step 4/6, `FLOW-8`).

## Status display — categorical here, % in the PDF (reconciles `INH-11`)
The on-screen profile popup + tree legend show **categorical only**: **No XLH / May have XLH /
Has XLH** (no percentage). The **percentage** (100/50/0) appears in the **PDF details table**
(`PDF-2`, p14). So `INH-11`: keep `chance` in the model, render **categorical in the UI**,
**categorical + %** in the PDF. (Confirm with design before final.)

## Accessibility (`A11Y-*`)
- Profile popup + all dialogs are `role="dialog" aria-modal`, focus-trapped, `Esc`, focus
  restore (`A11Y-6`). The tree node trigger is a `<button>` named "Name — relationship —
  status"; the tree has an accessible alternative (`A11Y-10`). Email dialog input labelled;
  "Email sent" announced via `role="status"`.

## Build & tests
- `createSummary(slot, { store, engine })`, `createProfilePopup(mount, { person })`,
  `createSummaryActions(mount, { onDownload, onEmail, onReset })`, `createActionDialog(...)`.
- Tests: click node → popup with right status/symptoms; download triggers PDF builder; email
  flow; reset clears store; dialogs trap focus + restore.
