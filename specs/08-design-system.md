# 08 — Design System: Tokens & Component Variants

Extracted from Figma (`b4bf3fgE9z0ow9hlAXzVuy`) via variable defs + component inspection.
This is the styling source of truth for the pixel-faithful UI phase. It **replaces** the
ad-hoc tokens currently in `src/style.css` (old red/blue status palette).

> Confidence: tokens (`TOKEN-*`) are pulled directly from Figma variables (exact). Component
> geometry marked _(confirm at build)_ should be verified with `get_design_context` on the
> specific node when that component is built in Phase 4.

## TOKEN-1 — Color

| Token | Value | Use |
|-------|-------|-----|
| `--color-brand-steel` | `#343e59` | primary text, icons, outlines, dark surfaces |
| `--color-brand-lime` | `#c9e87c` | **XLH-positive** highlight (chromosome/person fill), secondary surface |
| `--color-brand-snow` | `#f6f6f6` | light surfaces, inverse text on dark/CTA |
| `--color-brand-teal` | `#a1f0ed` | accent |
| `--color-bg-page` | `#ffffff` | page background |
| `--color-text-on-page` / `on-surface-primary` | `#343e59` | body text |
| `--color-text-inverse` (on-surface tertiary/quinary) | `#f6f6f6` | text on steel/CTA |
| `--color-input-border` | `#5d657a` | input border default |
| `--color-input-border-focus` | `#343e59` | input border highlight |
| `--color-input-placeholder` | `#858b9b` | placeholder |
| `--color-input-text` | `#343e59` | typed text |
| `--color-border-subtle` | `#858b9b` | dividers |
| `--color-disabled` | `#c5c5c5` | disabled text/links/buttons |
| `--color-btn-primary-bg` | `#f6f6f6` | "ghost" button bg (e.g. "+ Add …") |
| `--color-btn-primary-bg-hover` | `#d6d8de` | ghost hover |
| `--color-btn-primary-border` / `text` | `#343e59` | ghost border + label |
| `--color-btn-secondary-bg` | `#ad0b49` | **solid CTA** (magenta) bg |
| `--color-btn-secondary-text` | `#f6f6f6` | CTA label |
| `--color-btn-tertiary-bg` | `#ffffff` | outline button bg |
| `--color-btn-tertiary-border` / `text` | `#ad0b49` | outline button border + label |
| `--color-annotation-magenta` | `#ff00e1` | **not a UI color** — Figma redline for `[dynamic name]` interpolation |

Status → color mapping (drives pedigree + legend, see `UI-ICON`, `INH-11`):
`HAS_XLH` = solid `--color-brand-lime` fill; `MAY_HAVE_XLH` = half lime; `NO_XLH` =
outline only (`--color-brand-steel` stroke, no fill).

## TOKEN-2 — Typography

Family: **GT America** (`--font-primary`). Weights: Regular 400, Medium 500, Bold 700,
Condensed Bold, Extended Bold. ⚠️ GT America is a **licensed font** — see `DS-ASSET`.

| Style token | size / line-height | weight |
|-------------|--------------------|--------|
| `--text-h2` | 48 / 52 | Condensed Bold |
| `--text-h4` | 32 / 40 | Condensed Bold |
| `--text-h5` | 24 / 32 | Condensed Bold |
| `--text-subhead` | 24 / 32 | Medium |
| `--text-eyebrow` | 20 / 24 | Condensed Bold |
| `--text-body-lg` | 20 / 28 | Regular/Bold |
| `--text-body-md` | 16 / 22 | Regular/Bold |
| `--text-body-sm` | 14 / 18 | Regular/Bold |
| `--text-footnote` | 12 / 14 | Regular |
| `--text-btn-lg` | 16 / 16 | Extended Bold |
| `--text-btn-md` | 14 / 14 | Extended Bold |

## TOKEN-3 — Spacing

`--space-micro-xs 2`, `-sm 4`, `-md 8`, `-lg 12` · `--space-component-xs 16`, `-sm 24`,
`-md 32`, `-lg 40`, `-xl 48` · `--space-button-xs 4`, `-sm 8`, `-md 12`, `-lg 16`, `-xl 20`
· `--space-section-xs 48`, `-sm 64`, `-lg 96`, `-xl 120` · `--space-margin 120`.

## TOKEN-4 — Radius

`--radius-form 8` (inputs) · `--radius-menu 12` (dropdowns/cards) · `--radius-button 32`
(pill) · `--radius-cta 32`.

## TOKEN-5 — Breakpoint
Figma design widths: mobile **360**, desktop **1440**. Implementation switches the
single-column → two-column composition at **`$bp-desktop` = 768px** (Sass var/mixin in
`src/styles/_breakpoints.scss`; media queries can't read CSS custom properties). Mobile-first.

---

## Component catalog & variants

### DS-SHELL — global app container (`.page` + `.app-shell`)
The **single container for the whole tool** — start screen, every wizard step, and the
summary all render inside it. `.page` = steel field (page bg) with a relative margin that
scales with the screen; `.app-shell` = centered snow card, **`max-width: 1200px`** (fills
100% below that), large radius, internal padding. This is the generalization of the original
`start__card`. Screens add their own internals inside `.app-shell` (e.g. the start two-column,
or the wizard stepper + input-card + tree-preview). Defined in `src/styles/_components.scss`.

### DS-BUTTON — Button (instances, not a variant set)
Three visual types (from TOKEN-1) × two sizes (`lg`/`md`, TOKEN-2) × states. Pill radius 32,
padding from `--space-button-*`, label Extended Bold.

There are **three** distinct visual styles (verified by screenshot — note the two outline
styles differ by border color):

| Style | Fill | Border | Label | Used by (instances) |
|-------|------|--------|-------|---------------------|
| **Solid CTA** (secondary token) | magenta `#ad0b49` | none | snow `#f6f6f6` | `button-next`, `button-yes`, `button-mom`, `button-dad`, `button-grandmother`, `button-grandfather`, `button-pdf`, `button-email` |
| **Magenta outline** (tertiary token) | white | magenta `#ad0b49` | magenta | `button-back` (GO BACK), `CLOSE` (pop-ups) |
| **Steel outline** (primary token) | snow `#f6f6f6` | steel `#343e59` | steel | `button-neither`, `button-idk`, `START OVER`, `+ Add spouse/partner`, `+ Add their children`, `+ Add sibling`, `tool add edit button` |

> `button-skip` color is _confirm-at-build_ (landing screens) — likely magenta-outline.
> **Correction:** an earlier draft put neither/idk on the magenta-outline style; the
> screenshot shows them **steel** outline (the `primary` token). Map by token value, not name
> — `primary` token = the light steel-outline neutral button; `secondary` = the magenta CTA.

**Geometry (verified):** pill radius 32. Stacked choosers/landing buttons **48px** tall,
full-card width (227–308px). Bottom nav pair (`button-back` + `button-next`) **56px** tall,
**152px** wide each, **16px** gap, side-by-side spanning the 320px card width. Stacked
result buttons (pdf/email/start-over) **48px**, full width, **16px** vertical gaps.

States (apply per style): **default**, **hover** (steel-outline → bg `#d6d8de`; solid/
magenta-outline darken), **pressed**, **disabled** (gray `#c5c5c5` fill/label — e.g. **Dad**
for a male proband, `FLOW-5a`, with the "can only get XLH from their mom" tooltip),
**focus** (visible ring — a11y). **Selected** (mom/dad/grandparent chooser): selected =
solid CTA, unselected = its outline style.

### DS-ADDEDIT — `tool add edit button` (real variant set)
`Property 1 = Default | hover` (`1659:38304/38303`). The small inline + / edit affordance on
tree nodes and "Add another…" rows.

### DS-RADIO — `radio button + label`
Used for **Gender assigned at birth** (Male/Female) and **Do you have XLH?**
(Yes/No/Unsure; parent/grandparent selectors offer Yes/Unsure only — `DM-2`). States:
default, **selected** (filled steel dot), disabled, focus. Inline horizontal layout.

### DS-INPUT — `textfield + icon` (`2005:12957`)
Single-line text (name). Radius `--radius-form 8`, border `--color-input-border`, focus
border `--color-input-border-focus`, placeholder `--color-input-placeholder`. States:
empty/placeholder, filled, focus, error _(confirm at build)_, disabled.

### DS-SYMPTOMS — symptoms control
Collapsed select showing "N symptoms selected" → expands to a checklist (checkbox + label),
short list inline vs **full list pop-up** (`UI-1.3`). Only present when answer ∈ {Yes,Unsure}
(`DM-7`). Checkbox states: unchecked, checked (lime/steel), focus.

### DS-STEPS — `Steps` progress (variant set)
`Property 1 = Default | Step 1 | Step 2 | Step 3 | Step 4 | Step 5 | Step 6 | Mobile`
(`1213:31632…32107`, mobile `1239:43571`). Seven labels (`UI-PROG`); current step emphasized.

### DS-INPUTCARD — `Input Card` (variant set, `1226:35840`)
`Property 1 = A | B | C | D | E`. The white rounded content card per step. Observed (top→
bottom in the component frame): **A** base form; **B** form + collapsed symptoms select;
**C** form + expanded symptoms checklist; **D** multi-person/added state; **E** parent/
grandparent detail ("Does your mom have XLH?" + symptoms). _(A–E exact mapping: confirm at build)_

### DS-LANDING — `Landing Card` (variant set, `1240:19704`)
`Property 1 = Landing A | Landing B | Last Card`. The "Would you like to add your …?"
Yes/Skip screens for optional steps (`FLOW-2`) and the closing card.

### DS-TREE — `Digital Tree` (variant set, `1235:39888`)
`Property 1 = Tree 1 | Tree 2 | Tree 3 | Result`. Tree rendering states by family size; the
`Result` variant is the final summary tree (`UI-7.1`).

### DS-POPUP — `Pop-up Card` + `Pop-up Overlay` (`1238:42654` / `1240:17034`)
Modal shell for: full symptoms list, add-partner, add-their-children, limit-reached
(`UI-LIMIT`), reset-confirm, email, email-sent. Overlay scrim + centered card + actions.

### DS-PERSONICON — person icons (`UI-ICON`, PDF p2)
Six states: {Male, Female} × {Has XLH = full lime, May have = half lime, No XLH = outline}.
Male = square-ish body, Female = body w/ skirt per Figma `XLH_Male`/`XLH_Female`,
`May have XLH icon` `1425:13194`.

### DS-CHROMO — chromosome chips (`UI-ICON`, PDF p12)
`XX` (female) / `XY` (male) pills; the XLH-bearing X highlighted lime. Males highlight their
single X. Shown in the profile pop-up (`UI-7.1`) and PDF legend.

### DS-LEGEND — `XLH status container` (`2005:14931`)
Legend rows: **No XLH** / **Has XLH** / **May have XLH** with ellipse swatches; plus
chromosome-with/without-XLH key. Appears in summary + PDF footer.

---

---

## Verified geometry & visuals (deep-extract — Phase-4 ready)

Pulled from Figma metadata geometry + component screenshots (Code Connect declined — no code
components to map yet). These are confirmed, not _(confirm at build)_.

### Input Card (the white step card)
White surface, **lime `#c9e87c` ~1px border**, rounded; mobile content width **288** inside
**16px** padding (card ~320 wide). Top→bottom: **eyebrow** (e.g. "STEP 1 - TELL US ABOUT
YOURSELF", uppercase steel, `--text-footnote`/eyebrow), **title** ("Provide your details",
`--text-h5` condensed bold steel), **"*Required field"** footnote, then fields. A thin
**lime divider** separates repeated person blocks. Breadcrumb dots (7×7 ellipses, 15px
pitch) bottom-center indicate sub-screens.

### Field label + input (DS-INPUT)
Label is `--text-body-sm` **bold** steel, with a right-aligned collapse **`—`/`+`** toggle
for repeatable sections. Input: full width, **~48px** tall, radius `--radius-form 8`, 1px
`--color-input-border #5d657a`, placeholder `--color-input-placeholder #858b9b`
("Enter name"), focus border `--color-input-border-focus #343e59`.

### Radios (DS-RADIO)
Row height **24px**; circle (steel stroke, filled steel dot when selected) + label
`--text-body-sm`. Options laid out horizontally, ~**12px** gap. Groups: Gender (Male/Female,
~173px), XLH (Yes/No/Unsure, ~232px). Two side-by-side label groups per row
("Gender assigned at birth*" | "Do you have XLH?*").

### Steps — mobile (DS-STEPS, `1239:43571`)
**328×50** lime `#c9e87c` bar: left "**STEP _n_ OF 6**" (steel, bold caps), center
"**VIEW TREE**" steel-outline pill toggle (switches to tree preview), right "**EXIT** ↦"
steel link. (Desktop uses the full 7-dot labeled stepper, `UI-PROG`.)

### Person icons (DS-PERSONICON)
Humanoid silhouette, steel `#343e59` stroke; **gender by body shape** (female = skirt/dress,
male = legs). **Status by fill:** No XLH = outline only; May have XLH = **half** lime; Has
XLH = **full** lime body. The head is a status circle matching the legend swatch.

### Chromosome chips (DS-CHROMO)
Small circular chips labelled **X** / **Y**; the XLH-bearing chromosome is **lime-filled**,
others steel-outline. Male shows `X`(lime) `Y`(steel) when affected — only the single X
highlights. Shown next to the name in the profile pop-up.

### Legend (DS-LEGEND)
Circle swatches: **○ No XLH** (outline) · **◐ May have XLH** (half lime) · **● Has XLH**
(full lime). Plus chromosome key (● = chromosome with XLH / ○ = without). Appears under the
tree and in the PDF footer.

### Profile pop-up (DS-POPUP, summary variant)
Dark **steel `#343e59`** rounded card over a scrim. **Name in lime** (`--text-h5`),
relationship + computed status in white caps ("COUSIN / MAY HAVE XLH"), **"Symptoms:"** bold
+ bulleted list (`--text-body-sm`), then the chromosome legend. Close **✕** top-right (snow).
Tree connectors: steel, thin, elbow parent→child with a horizontal sibling bar.

## DS-ASSET — Font licensing (open item)
**GT America** is a commercial typeface (Grilli Type). We need either the licensed web-font
files (woff2) to self-host, or confirmation the host page provides it. In the iframe the tool
must load its own `@font-face` (host fonts don't cross the frame). Until resolved, fall back
to a close system stack: `"GT America", "Helvetica Neue", Arial, system-ui, sans-serif`.
_Action: confirm licensing/asset delivery with the client before Phase 4 UI build._

## Implementation note
Define all tokens as CSS custom properties on `:root` in `src/style.css` (replacing the old
palette), named as above. Components (Phase 4) consume only these vars — no hardcoded hex.
This is the DRY-with-a-brake (R5) seam for styling: tokens are the genuinely-shared layer.
