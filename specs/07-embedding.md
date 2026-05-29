# 07 — Embedding (iframe in XLHLink.com)

The tool ships as a **single-page app** embedded via `<iframe>` in XLHLink.com (the host).
This constrains storage, sizing, navigation, downloads, and security.

## `EMBED-1` Single page / single entry
One HTML entry point (`index.html`). The entire experience — start screen, 6 wizard steps,
overlays, and the final tree/summary — renders **in place** in that one page (no full-page
navigation between steps). The separate `tree-builder.html` mode is **retired** (not a
second page). Vite build has a single input.

## `EMBED-2` No persistence — in-memory only
Do **not** use `localStorage`/`sessionStorage`/cookies/IndexedDB for the family tree:
- Third-party iframe storage is partitioned or blocked by modern browsers (Safari ITP,
  Chrome storage partitioning), so it's unreliable anyway.
- The tool's disclaimer states data "will not be stored" (see PII/PHI note).

The `FamilyStore` keeps state **in memory only**; a reload starts fresh. (This supersedes the
current `FamilyStore` localStorage save/load, which Phase 3 removes.) "Start over" clears the
in-memory store.

## `EMBED-3` Auto-height via postMessage
Iframes do not auto-grow to content. The app measures its document height and posts it to the
host so the host can resize the iframe. Fire on: load, step change, overlay open/close,
window resize (debounced), and tree render.

```js
// in-app: publish height to host
function postHeight() {
  const h = document.documentElement.scrollHeight;
  parent.postMessage({ type: 'xlh-tree:height', height: h }, HOST_ORIGIN); // never '*'
}
```

- `HOST_ORIGIN` is an **allowlist** of XLHLink.com origins — never `'*'` (js-code-review:
  postMessage origin rule).
- Host side listens, verifies `event.origin` against the same allowlist, and sets
  `iframe.style.height`. A `<details>`-style host snippet ships in the integration doc.
- Avoid layouts that depend on the iframe's own viewport height (`100vh`, viewport-anchored
  `position: fixed`) — height is driven by content, not the iframe box.

## `EMBED-4` Navigation & links
Any outbound link (e.g. "consult a healthcare professional", QR/CTA) opens in the **host**
context, not inside the iframe: `target="_blank" rel="noopener noreferrer"` (new tab) or
`target="_parent"`. Never navigate `top`/trap the host. No reliance on `window.top` access
(cross-origin throws).

## `EMBED-5` Downloads & Share from an iframe
- **PDF download** (`PDF-*`): a blob + `<a download>` click works only if the host iframe is
  **not** sandboxed without `allow-downloads`. Document the requirement; provide a fallback
  (open the blob in a new tab) if the download is blocked.
- **Web Share API** (`navigator.share`): requires transient activation and is often
  unavailable in cross-origin iframes → **mailto fallback** (already the app's pattern).
- **Clipboard** (if used): needs `allow="clipboard-write"` on the iframe.

## `EMBED-6` CSS & isolation
The iframe boundary already isolates the app's CSS from the host (and vice-versa) — this is
why the project needs no Shadow DOM (R4). Still ship a CSS reset and own the full box.
Mobile-first 360px, fluid up to the host-controlled width.

## `EMBED-7` Security / host requirements (integration doc)
Recommended host embed:

```html
<iframe
  src="https://<tool-host>/"
  title="XLH Family Tree Tool"
  style="width:100%;border:0"
  allow="downloads"
  referrerpolicy="no-referrer"
></iframe>
```

- If the host sandboxes the iframe, it must include at least:
  `sandbox="allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox"`
  (no `allow-same-origin` needed — we don't use storage).
- The tool host sets `Content-Security-Policy: frame-ancestors https://*.xlhlink.com …` so
  only XLHLink.com may embed it.
- All `postMessage` (both directions) validate origin against the XLHLink.com allowlist.

## `EMBED-8` Responsiveness inside the host
Width is owned by the host iframe; the app fills it. Height is published per `EMBED-3`. Test
matrix: 360 / 768 / 1024+ container widths; overlays must not exceed published height.
