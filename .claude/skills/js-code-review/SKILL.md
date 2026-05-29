---
name: js-code-review
description: >-
  Deep JavaScript/TypeScript code review for correctness and security bugs:
  race conditions and async/await ordering, memory leaks, XSS/injection/secrets
  and other security sinks, error handling (floating promises, empty catches),
  equality/coercion, scope/declaration, and performance pitfalls. Use when the
  user asks to review or audit JS/TS code, a diff, or a PR; to scan for bugs,
  race conditions, memory leaks, security issues, or async correctness; or asks
  "what could go wrong" in JavaScript. Also use proactively when reviewing
  changed JS/TS files. Not for Swift/iOS (use ios-swift-review) or general
  non-JS review.
---

# JS/TS Code Review

A bug- and security-focused reviewer for JavaScript and TypeScript. It complements
the generic `/code-review` skill by going deep on the JS-specific failure classes
that linters miss — especially **race conditions** and **memory leaks**, which are
heuristic and need reasoning, not just pattern matching.

## How to run a review

1. **Establish scope.** In priority order:
   - Files/dirs/PR the user named.
   - Otherwise the working diff: `git diff --merge-base <default-branch>` (fall back to
     `git diff HEAD`). Review only changed regions plus enough surrounding context to
     judge them.
   - For a whole-codebase audit, sweep `*.js/.jsx/.ts/.tsx/.mjs/.cjs/.vue/.svelte`.
2. **Scan by tier** (see below). Use `grep`/AST reasoning for static classes; reason
   about data/async flow for the heuristic classes.
3. **Confirm before reporting.** Read enough context to avoid false positives. If a
   pattern is intentional or guarded, don't flag it. If you're unsure, flag it as
   `review` severity rather than asserting a bug.
4. **Report** in the output format below — grouped by severity, each finding concrete
   and actionable with a fix.

## The three detectability tiers

Decide effort per class by how detectable it is:

- **Tier 1 — Static (AST/grep).** Concrete sinks and syntactic patterns. Cheap, high
  precision: security sinks, `==`, `var`, floating promises, empty catches, `await`
  in loops, `Math.random()` for tokens, hardcoded secrets, `parseInt` without radix.
- **Tier 2 — Heuristic (flow reasoning).** Needs tracing data/async flow: race
  conditions (stale responses, double-submit), memory leaks (listeners, timers,
  detached nodes, unbounded caches), stale closures, shared-mutable-state bugs.
- **Tier 3 — Human-review (flag with rationale).** Ambiguous intent: "is this
  coercion deliberate?", "is this listener ever removed elsewhere?". Surface with a
  question, don't assert.

See [`references/checklist.md`](references/checklist.md) for the exhaustive,
categorized pattern catalog with grep hints and code examples. Load it when scanning.

## Category index (what to look for)

1. **Race conditions & async ordering** (Tier 2) — stale-response clobber
   (search-as-you-type), unguarded read-modify-write across `await`, double-submit,
   `Promise.all` partial-failure assumptions, init races.
2. **Concurrency / event-loop** (Tier 2) — assuming code between `await`s is atomic;
   `SharedArrayBuffer`/`Atomics` data races; unbounded `Promise.all` fan-out.
3. **Memory leaks** (Tier 2) — forgotten listeners, uncleared timers/intervals,
   detached DOM refs, closures capturing large objects, unbounded `Map`/`Set`/cache
   growth, missing teardown on unmount/destroy.
4. **Security** (Tier 1, high-ROI) — XSS sinks (`innerHTML`, `insertAdjacentHTML`,
   `document.write`, `dangerouslySetInnerHTML`), `eval`/`new Function`/string
   `setTimeout`, prototype pollution, injection (SQL/shell/RegExp/ReDoS), hardcoded
   secrets, insecure randomness, `postMessage` w/o origin check, `target="_blank"`
   w/o `rel="noopener"`, open redirects, `fetch` not checking `res.ok`, missing
   cookie flags, **PII/PHI handling** (see project note).
5. **Error handling** (Tier 1/2) — floating promises, empty `catch {}`, swallowed
   rejections, `throw "string"`, `forEach` with async callback (doesn't await),
   `try/finally` returns masking errors.
6. **Equality / coercion / types** (Tier 1) — `==`/`!=`, `if (count)` where `0` is
   valid, `|| ` vs `??`, `NaN` compares, `parseInt` no radix, `typeof` typos, sort
   without comparator.
7. **Scope / declaration** (Tier 1) — `var`, closures-in-loops with `var`, shadowing,
   `let` never reassigned, reassigned params, dead code, TDZ.
8. **Performance / correctness** (Tier 1/2) — `await` in independent loop iterations
   (→ `Promise.all`), DOM queries in loops, layout thrashing, regex compiled in hot
   paths, `JSON.parse(JSON.stringify())` clone (loses Dates/undefined/functions),
   index-as-key in React lists, missing/ wrong `useEffect` deps & cleanup.

## Severity rubric

| Severity | Meaning |
|----------|---------|
| **Critical** | Exploitable security hole, data loss/corruption, or guaranteed crash on a real path |
| **High** | Likely bug under normal use (race clobber, leak that degrades the session, swallowed error hiding failures) |
| **Medium** | Bug under edge cases, or a footgun likely to bite later |
| **Low** | Smell / correctness risk with low impact |
| **Nit** | Style/clarity; mention briefly |
| **review** | Suspected but needs human judgment of intent — phrase as a question |

## Output format

Start with a one-line summary and a count table, then findings grouped by severity
(Critical first). Each finding:

```
### [SEVERITY] <short title> — <category>
`path/to/file.js:LINE`

<1–3 sentences: what's wrong and the concrete failure scenario.>

```js
// the problematic code (trimmed)
```

**Fix:** <concrete remedy>
```js
// corrected code
```
```

End with: anything intentionally **not** flagged (and why), and any areas you couldn't
verify. Prefer fewer high-confidence findings over a noisy list; never invent line
numbers — cite what you actually read.

## Project note — PII / PHI

If the project handles personal or health data (e.g. this XLH family-tree tool, which
states data "will not be stored, shared, or used for marketing"), additionally check:
no accidental persistence (`localStorage`/`sessionStorage`/cookies/IndexedDB) of
personal health info, no logging of PII/PHI (`console.*`, analytics, error reporters),
and no transmission to third parties. Treat violations as **High/Critical**.
