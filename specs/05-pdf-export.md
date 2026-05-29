# 05 — Downloadable PDF Export

Sources: PDF p13–p14; Figma "Downloadable PDF" `1409:23408` (pages at 200%).

The deck text (p13) says "3 sections", but the Figma export (`1409:23408`) lays it out as
**4 pages**. We follow Figma.

### `PDF-1` Page 1 — Family tree diagram
Symbol `1678:16782`. The rendered pedigree (same layout as UI-7.1), header
"[Name]'s XLH Family Tree", legend (No XLH / May have XLH / Has XLH; chromosome with/without
XLH), and the disclaimer footer. Branding `XLH-logos`.

### `PDF-2` Page 2 — Details of individuals (table)
Symbol `1592:24797`. Four columns (PDF p14): **Name · Family member · XLH status · Symptoms**.
- XLH status renders chromosome chips + label per `INH-11`
  ("Has XLH (100%)", "May have XLH (50% chance)", "No XLH", …).
- Symptoms column lists the person's selected symptom group names, or "N/A".

### `PDF-3` Page 3 — Table continued
Symbol `1678:18227`. Overflow rows of the same table when > one page of people.

### `PDF-4` Page 4 — Full list of common XLH symptoms
Symbol `1678:18817`. The complete symptom catalog (`DM-5`) grouped by category, plus the
"Could XLH be part of your story, too?" QR/CTA block.

### `PDF-5` Pagination & 50-node fit
Must remain legible up to the 50-person cap (`DM-8`); Figma proves layout with
`Family Tree Export Testing for 50 nodes` `1204:28890`. Table overflow flows to PDF-3
(repeat header). Page footer carries the chromosome legend and "PAGE n OF m".

### `PDF-6` Status asterisk
Every computed status in the table carries `*` → footnote "Calculated based on user
response. Not a formal diagnosis." (p14).
