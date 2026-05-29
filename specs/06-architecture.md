# 06 — Architecture & Coding Conventions

How we write code in this vanilla-JS + Vite project. These are the rules the
[`CLAUDE.md`](../CLAUDE.md) enforces; this doc is the detailed reference with examples.
Web Components / Shadow DOM are intentionally **not** used here.

## R1 — Separate pure logic from DOM glue (the biggest win)

Draw a hard line between **logic** (computes things; no `document`/`window`; trivially
unit-testable) and **glue** (touches the DOM; imperative; dumb). Most messy vanilla is the
two tangled together.

```js
// lib/filter.js — pure. No DOM. Unit-tested in isolation.
export function applyFilter(items, query) {
  const q = query.trim().toLowerCase();
  return q ? items.filter(i => i.name.toLowerCase().includes(q)) : items;
}

// view.js — dumb glue. Takes data, writes DOM. No business rules.
export function renderList(el, items) {
  el.replaceChildren(...items.map(i => {
    const li = document.createElement('li');
    li.textContent = i.name;     // textContent, not innerHTML
    return li;
  }));
}
```

In this repo: pure logic lives in `src/engine/` (status engine) and `src/wizard/`
(flow machine); DOM glue lives in `src/components/`; state in `src/data/`. **No business
rule (inheritance %, flow decisions, validation) may live in a component.**

## R2 — A component is a factory that returns its own teardown

Every component takes its mount point + options, owns its DOM and listeners, and returns a
`destroy()`. The teardown **is the contract** — no `destroy()` = guaranteed leak (see the
js-code-review skill's memory-leak class).

```js
export function createCounter(mount, { initial = 0 } = {}) {
  let count = initial;
  const el = document.createElement('div');
  el.innerHTML = `<button data-inc>+</button><span data-val></span>`;
  const val = el.querySelector('[data-val]');
  const btn = el.querySelector('[data-inc]');

  const render = () => { val.textContent = count; };
  const onClick = () => { count++; render(); };

  btn.addEventListener('click', onClick);
  mount.append(el);
  render();

  return function destroy() {            // the contract
    btn.removeEventListener('click', onClick);
    el.remove();
  };
}
```

Composition = calling factories and collecting their `destroy`s. State is closure-private
(no globals). When a parent tears down, it calls every child's `destroy`.

## R3 — Declarative rendering: `view = f(state)`

State changes in **one** place; a render function derives the view from it. Use the pub/sub
store (`src/data/FamilyStore.js` is the project's instance of this pattern).

```js
export function createStore(initial) {
  let state = initial;
  const subs = new Set();
  return {
    get: () => state,
    set: (patch) => { state = { ...state, ...patch }; subs.forEach(fn => fn(state)); },
    subscribe: (fn) => { subs.add(fn); return () => subs.delete(fn); },
  };
}
```

Stop hand-patching the DOM from a dozen handlers — the store is the source of truth, the
view is a function of it.

**Catch:** rebuilding `innerHTML` on every change wipes child listeners *and* is an XSS
sink. Pair re-render with **event delegation** so behavior survives re-renders:

```js
// one listener on the container, declared once, survives any re-render
listEl.addEventListener('click', (e) => {
  const item = e.target.closest('[data-id]');
  if (item) store.set({ selected: item.dataset.id });
});
```

Data attributes + delegation is the closest vanilla gets to declaring behavior in markup.

## R4 — Lean on the platform for isolation

- **ES modules are the isolation boundary.** One concern per file, export a small public
  API, keep the rest module-private. No `window.foo` globals.
- **Auto-wire with `import.meta.glob`** instead of hand-maintained barrel files when
  registering a folder of modules:
  ```js
  const behaviors = import.meta.glob('./behaviors/*.js', { eager: true });
  const run = (root = document) => Object.values(behaviors).forEach(m => m.default?.(root));
  ```
- (No Web Components / Shadow DOM in this project.)

## R5 — DRY, with a brake

A little duplication is cheaper than the wrong abstraction. Extract a helper when you've
seen the same shape **three** times and the cases share a real reason to change — not the
first time two snippets look alike. DRY genuinely-repeated logic (formatters, fetch
wrappers, the `h()`/`createElement` helper); leave coincidentally-similar code alone until
the duplication actually hurts. A premature `createConfigurableWidget({…20 options})` is
worse than three honest 10-line functions.

## Enhancement style (for markup you don't render)

When attaching behavior to existing markup (rare here — mostly relevant if embedding in a
CMS page), prefer these over the factory pattern:

- **R6 — Event delegation first.** One delegated listener high in the tree handles every
  matching element, current and future (AJAX/CMS-injected), with zero teardown and zero
  leaks. Reach for per-element listeners only when delegation can't express it
  (e.g. `scroll`/`resize` on a specific element).
- **R7 — A behavior is a module: `init(root)`.** Export a default `init` that scans a root
  and sets things up. Guard against double-init (a `data-*ready` flag) so re-runs after an
  AJAX load don't stack duplicate listeners/observers.
- **R8 — The markup declares; JS interprets.** Config rides in `data-*` attributes; JS
  reads it. No scattered config objects or hardcoded per-instance selectors.
- **R9 — Scope queries to `root`,** never `document`, so a behavior can't reach outside its
  element.

## File layout

```
src/
  engine/       ← pure logic, zero DOM (status engine) — the most-tested code
  wizard/       ← pure flow state machine (no DOM)
  data/         ← state + pub/sub store, constants
  components/   ← one factory per file; owns its DOM + listeners; returns destroy()
  utils/        ← shared pure helpers (dom h(), id, events)
  main.js / tree-builder-main.js  ← wiring only
```

`lib/`-style pure helpers may live in `utils/` (DOM-free) here. The rule that matters is the
**pure-vs-glue split**, not the exact folder names.

## Testability contract

- Anything in `engine/`, `wizard/`, `data/` (logic), and `utils/` (pure helpers) must be
  unit-testable with **no DOM** (Vitest `node` env).
- Components are tested via behavior (jsdom + `@testing-library/dom`) and E2E (Playwright).
- A function that mixes computation and DOM access is a refactor smell — split it (R1).
