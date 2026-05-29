# 04 — Screens & Components (Figma)

Source: Figma `b4bf3fgE9z0ow9hlAXzVuy`, canvas `204:979`. **Responsive, both layouts**,
card-based. Pixel-faithful is the goal; build after logic is green.

> **Responsive strategy.** Mobile-first. Figma defines two compositions: **mobile** (360px
> `<instance>`, single-column) and **desktop** (1440 `<symbol>`, **two-column**). They are
> not the same layout scaled — e.g. 0.0 desktop is sample-tree-left + text-right; wizard
> steps are input-card + live-tree-preview side-by-side. The single-column → two-column
> switch is at **`$bp-desktop` = 768px** (`src/styles/_breakpoints.scss`). Fetch **both** the
> mobile instance and the desktop symbol per screen when building.

> **Single page, no router.** Every `UI-*` screen below is a *view state*, not a URL — the
> whole flow lives in one embedded page (`EMBED-1`). The current screen + open overlay are
> tracked by the flow machine's view state (`FLOW-STATE`), and the renderer is a pure
> `view = f(viewState)`. The `UI-*` ids are exactly the `screen`/`overlay` values the
> machine reports.

## Design system (frame `Components` `1266:31249`)

| Component | Symbol id | Variants |
|-----------|-----------|----------|
| Steps (progress) | `1213:31695` | Default, Step 1–6, Mobile `1239:43571` |
| Input Card | `1226:35840` | A `1226:35838`, B, C, D, E `1277:38623` |
| Landing Card | `1240:19704` | Landing A/B, Last Card `1240:19751` |
| Digital Tree | `1235:39888` | Tree 1/2/3, Result `1277:39635` |
| Pop-up Card / Overlay | `1238:42654` / `1240:17034` | – |
| Add/edit tool button | `1659:38305` | Default, hover |

Atoms: `textfield + icon` `2005:12957`; `radio button + label` (gender / XLH);
buttons `button-back/next/mom/dad/skip/yes/idk/neither`; person icons `XLH_Male`/`XLH_Female`,
`May have XLH icon` `1425:13194`; `Chromosomes` `2005:15283`; breadcrumb `Ellipses` dots;
`XLH status container` `2005:14931` (No/Has/May-have legend).

## Screen inventory (`UI-` ids map to PDF logic)

| UI | Screen | Figma instance | Logic |
|----|--------|----------------|-------|
| `UI-0` | Start | 0.0 `1819:17712` | – |
| `UI-1.1` | Step 1 form | `1266:17514` | DM-1/2, FLOW-1 |
| `UI-1.1t` | Step 1 tree-toggle | `1599:17195` | live tree preview |
| `UI-1.2` | Step 1 + symptoms checklist | `1266:18294` | DM-5, DM-7 |
| `UI-1.3` | Full symptoms list popup | `1348:12939` | DM-5 |
| `UI-1.4` | Add partner/spouse popup | `1348:12080` | FLOW-3, FLOW-9 |
| `UI-1.5` | Partner added | `1348:12267` | FLOW-3 |
| `UI-1.6` | Review/edit | `1266:19836` | – |
| `UI-2.1` | Add children landing (Yes/Skip) | `1276:34007` | FLOW-2 |
| `UI-2.2` | Children input | `1276:35232` | – |
| `UI-2.3` | Children review | `1352:21055` | – |
| `UI-3.1` | Add siblings landing | `1421:14710` | FLOW-2 |
| `UI-3.2` | Sibling input | `1430:13561` | – |
| `UI-3.4` | Add sibling's children popup | `1439:14695` | FLOW-9 |
| `UI-4.1` | Pick a parent (Mom/Dad/Neither/IDK) | `1441:19479` | FLOW-5 |
| `UI-4.1m` | Pick a parent — male user (Dad disabled + tooltip) | `1773:19739` | FLOW-5a |
| `UI-4.2` | Parent detail (Yes/Unsure + symptoms) | `1519:24389` | FLOW-5b |
| `UI-5.1` | Aunts/uncles landing | `1521:38668` | FLOW-2 |
| `UI-5.2` | Aunt/uncle input | `1521:41323` | – |
| `UI-5.4` | Add their children popup | `1521:47363` | FLOW-9 |
| `UI-6.1` | Pick grandparent (maternal/paternal) | `1521:52687` | FLOW-6 |
| `UI-6.2` | Grandparent detail | `1521:50572` | – |
| `UI-7.1` | Summary tree + profile popup | `1833:41100` | INH-*, PDF-* |
| `UI-7.2` | Reset confirmation | `1521:54464` | – |
| `UI-7.3` | Enter email | `1521:55772` | PDF email |
| `UI-7.4` | Email confirmation | `1521:56192` | – |
| `UI-LIMIT` | 50-person limit popup | `1657:31234` | FLOW-LIMIT |

## Cross-cutting

### `UI-ICON` Person + chromosome icons (PDF p2, p12)
Six person states: {Male,Female} × {has XLH=full green, potential=half green, no XLH=outline}.
Chromosome chips: XX (female) / XY (male); the green-highlighted chromosome marks the
XLH-bearing X. Males highlight their single X (PDF p12).

### `UI-PROG` Steps progress strip (PDF p2)
Seven labels: Tell us about yourself · Add children · Add siblings · Add a parent ·
Add Aunts & Uncles · Add Grandparents · → Your Family Tree. Current step emphasized.

### `UI-SUMMARY` Summary actions (PDF p11)
Download & print PDF · Share via email · Start over. Profile click opens an overlay with
chromosomes, computed status, and symptoms. Includes the legal disclaimer block.
