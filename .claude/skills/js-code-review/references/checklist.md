# JS/TS Pitfall Catalog

Exhaustive, categorized patterns with detectability tier, grep/AST hints, and
before/after examples. Tier 1 = static, Tier 2 = heuristic flow reasoning,
Tier 3 = flag-for-human.

---

## 1. Race conditions & async ordering (Tier 2)

JS is single-threaded, but outcomes that depend on *which async op finishes first*
race. Code between `await`s is **not** atomic — other callbacks run during the pause.

- **Stale-response clobber (search-as-you-type).** A slow request resolves after a
  newer one and overwrites fresh state.
  ```js
  let results;
  async function search(q) { results = await fetch(`/api?q=${q}`); } // "a" can land after "ab"
  ```
  **Fix:** track a request id / `AbortController` to cancel stale fetches; debounce input.
  ```js
  let ctrl;
  async function search(q) {
    ctrl?.abort(); ctrl = new AbortController();
    results = await fetch(`/api?q=${q}`, { signal: ctrl.signal });
  }
  ```
- **Read-modify-write across `await`.** `const b = await getBalance(); await setBalance(b - 100);`
  — `b` may be stale by the second await. Fix: atomic server op, optimistic lock, or queue.
- **Double-submit.** Click handler fires again before the first completes. Fix: disable the
  control / set an in-flight flag / idempotency key.
- **`Promise.all` partial failure.** One rejection rejects the whole and you lose the others'
  results; also the others aren't cancelled. Consider `Promise.allSettled`.
- **Initialization race.** Module-load side effects or lazy singletons created twice under
  concurrent callers. Fix: memoize the in-flight promise.
- Grep hints: `await\s+fetch`, multiple `await` in one function touching shared vars,
  `addEventListener('click'` handlers that `await`, `.then(` without ordering guards.

## 2. Concurrency / event loop (Tier 2)

- Assuming statements between `await`s run without interleaving — they don't.
- `forEach` with an `async` callback does **not** await — iterations float. Use `for...of`
  with `await`, or `Promise.all(map(...))`.
  ```js
  items.forEach(async (i) => { await save(i); }); // returns before saves finish
  ```
- **Unbounded fan-out:** `Promise.all(hugeArray.map(fetchEach))` opens thousands of sockets.
  Fix: concurrency-limit (pool / `p-limit`-style batching).
- `new Promise(async (resolve) => …)` anti-pattern — rejections inside the async executor
  are lost. Don't wrap async in the Promise constructor.
- `SharedArrayBuffer` + `Atomics` — the only true shared-memory data races; rare, review hard.

## 3. Memory leaks (Tier 2)

Anything reachable from a root (global, live listener, active closure, timer) won't be GC'd.

- **Forgotten listeners** — added, never removed; worst in SPAs on unmount. Anonymous
  handlers can't be removed at all.
  ```js
  window.addEventListener('resize', handler); // no removeEventListener on teardown
  ```
- **Uncleared timers** — `setInterval`/`setTimeout` whose closure keeps everything alive.
  Always pair with `clearInterval`/`clearTimeout`.
- **Detached DOM nodes** — element removed from the document but still referenced by a JS
  var/array/map, so its subtree can't be collected.
- **Closures capturing large objects** they don't need; long-lived closures pinning big arrays.
- **Unbounded caches** — `Map`/`Set`/object cache that only grows, never evicts. Use an LRU
  cap or `WeakMap`/`WeakRef` for key-tied lifetimes.
- **Observers** — `IntersectionObserver`/`ResizeObserver`/`MutationObserver` not
  `disconnect()`ed; `AbortController` not aborted; subscriptions not unsubscribed.
- Detect: heap snapshots in DevTools (snapshot → act → snapshot → compare retained size).
- Grep hints: `addEventListener` without matching `removeEventListener`; `setInterval`
  without `clearInterval`; `new (Resize|Intersection|Mutation)Observer` without `disconnect`.

## 4. Security (Tier 1 — highest ROI)

- **XSS sinks** fed non-constant input: `innerHTML`, `outerHTML`, `insertAdjacentHTML`,
  `document.write`, `$(el).html(x)`, React `dangerouslySetInnerHTML`. Prefer `textContent`,
  or sanitize (DOMPurify). Grep: `innerHTML|outerHTML|insertAdjacentHTML|document\.write|dangerouslySetInnerHTML`.
- **Code execution:** `eval(`, `new Function(`, `setTimeout("…")`/`setInterval("…")` with a
  string. Grep: `\beval\(|new Function\(|setTimeout\(\s*["'\`]`.
- **Prototype pollution:** recursive merge/clone or assignment into `__proto__`,
  `constructor`, `prototype` from user input. Grep: `__proto__|\["constructor"\]|prototype\s*\]`.
- **Injection:** string-concatenated SQL, `child_process.exec` with interpolation, `RegExp`
  built from user input (**ReDoS** — catastrophic backtracking). Use parameterized queries,
  `execFile` with arg arrays, escape/validate.
- **Hardcoded secrets:** API keys/tokens/passwords in source. High-signal prefixes: `sk-`,
  `AKIA`, `ghp_`, `xox[baprs]-`, `-----BEGIN ... PRIVATE KEY-----`; long high-entropy strings.
- **Insecure randomness:** `Math.random()` for tokens/ids/crypto. Use
  `crypto.getRandomValues` / `crypto.randomUUID()`.
- **`postMessage`** handler without `event.origin` check; `postMessage(data, '*')` target.
- **`target="_blank"`** without `rel="noopener noreferrer"` (reverse-tabnabbing).
- **Open redirect** — redirecting to a user-supplied URL without allowlist.
- **`fetch` not checking `res.ok`** — `fetch` only rejects on network error, not on 4xx/5xx;
  `await res.json()` on an error page silently mis-parses. Also: no timeout/abort.
- **CORS/cookies** — wildcard CORS with credentials; cookies missing `HttpOnly`/`Secure`/
  `SameSite`.
- **Timing-unsafe secret compare** — `===` on tokens/HMACs (use constant-time compare server-side).
- **Sensitive data exposure** — secrets/PII in `localStorage`, URLs (query strings), logs.

## 5. Error handling (Tier 1/2)

- **Floating promises** — an async call as an expression statement, never awaited/`.then`/
  `.catch`. AST: `ExpressionStatement` whose expression is a Promise-returning `CallExpression`.
- **Empty catch** — `catch (e) {}` swallows errors. Grep: `catch\s*\([^)]*\)\s*\{\s*\}`.
- **Swallowed rejections** — promise chain with no `.catch`; `await` in a critical path with
  no surrounding `try/catch`.
- **`throw "string"`** / throwing non-Error — loses stack trace. Throw `new Error(...)`.
- **`try { return x } finally { return y }`** — finally's return masks value/throw.
- **Unhandled rejection / uncaught** — no global handler; rejected promise in an event handler.

## 6. Equality / coercion / types (Tier 1)

- `==`/`!=` instead of `===`/`!==` (allow the deliberate `== null` idiom). Surprises:
  `0 == ''`, `null == undefined`, `[] == false`, `'0' == false`.
- **Falsy-trap:** `if (count)`, `value || default`, where `0`/`''`/`false` are valid values —
  use `?? ` / explicit `!= null`.
- **`NaN` compares** — `x === NaN` is always false; use `Number.isNaN(x)`. `NaN !== NaN`.
- **`parseInt` without radix** — `parseInt('08')`; pass `parseInt(s, 10)` or use `Number`.
- **`typeof` typos** — `typeof x === 'undefiend'` / `'function '` (trailing space) silently
  always false.
- **Floating point** — `0.1 + 0.2 !== 0.3`; money in floats. Use integer cents / decimal lib.
- **`sort()` without comparator** — lexicographic (`[1,10,2]`); also mutates in place.
- **`Number.MAX_SAFE_INTEGER`** — large int math loses precision; use `BigInt`.
- **`for...in` over arrays** — iterates keys incl. inherited/added props; use `for...of`.
- **Locale-dependent** `toLowerCase`/`localeCompare` used for canonical/locale-insensitive keys.

## 7. Scope / declaration (Tier 1; most linters cover these)

- `var` instead of `let`/`const`; **closures-in-loops with `var`** capturing final `i`.
- Variable shadowing; assigned-but-never-read; functions defined but never called (dead code).
- `let` never reassigned → should be `const`.
- Reassigning function parameters (esp. with default params / `arguments`).
- TDZ — using `let`/`const` before declaration; relying on `var`/function hoisting.

## 8. Performance / correctness (Tier 1/2)

- **`await` in a loop with independent iterations** → serial when it should be
  `await Promise.all(items.map(...))`. AST: `AwaitExpression` inside `For/While` not data-
  dependent on prior iterations. Very common real bug.
- **DOM query in a loop** — repeated `document.querySelector`/`getElementById`; hoist it.
- **Layout thrashing** — interleaving reads (`offsetHeight`, `getBoundingClientRect`) and
  writes in a loop forces sync reflow each iteration; batch reads then writes.
- **Regex compiled in a hot path/loop** — hoist `new RegExp`/literal out.
- **`JSON.parse(JSON.stringify(x))` clone** — drops `undefined`, functions, `Date`→string,
  `Map`/`Set`, breaks circular. Use `structuredClone`.
- **Allocations in hot paths** — spreading/`.map().filter()` chains over large arrays per frame.
- **`setInterval` for animation** — drifts; use `requestAnimationFrame`.
- React-specific: index-as-key in dynamic lists; missing `useEffect` deps (stale closure) or
  missing cleanup return; state mutated in place (same ref → no re-render);
  new object/array/function literals as props/deps each render.

## 9. Also worth flagging

- **`structuredClone`/`postMessage` of non-cloneable** (functions, DOM nodes) throws.
- **`Date` parsing** — `new Date('2020-01-01')` is UTC vs `'2020/01/01'` local; timezone bugs.
- **`Array(n)` sparse arrays** / `delete arr[i]` leaving holes that `map`/`forEach` skip.
- **Mutating an array/object while iterating it.**
- **Mutating shared references** passed across modules (callers see unexpected changes).
- **Optional chaining masking bugs** — `a?.b.c` still throws on `b` undefined; precedence.
- **`async` constructor** — constructors can't await; returns the instance, not a promise.
- **`this` binding** — method passed as callback loses `this`; arrow vs bound.
- **Recursion without a base case** / deep recursion → stack overflow.
- **`localStorage`/`JSON.parse` without try/catch** — throws on quota / malformed data.
- **Floating async in tests** — assertions after an unawaited promise pass falsely.
- **Comparator returning a boolean** to `sort` instead of a number.
- **Number parsing inconsistency** — `+x` vs `Number(x)` vs `parseInt` give different results
  for `''`, `'  '`, `'12px'`, `null`.
