import { describe, it, expect } from 'vitest';
import { computeStatuses, statusLabel } from '../src/engine/StatusEngine.js';
import { SEX, XLH_ANSWER, XLH_RESULT } from '../src/data/constants.js';

const { MALE, FEMALE } = SEX;
const { YES, NO, UNSURE } = XLH_ANSWER;
const { HAS, MAY_HAVE, NO: NO_XLH } = XLH_RESULT;

let _seq = 0;
function person(attrs = {}) {
  return {
    id: attrs.id ?? `p${_seq++}`,
    sex: attrs.sex ?? FEMALE,
    answer: attrs.answer ?? null,
    parentIds: attrs.parentIds ?? [],
    ...attrs,
  };
}

/** Compute and return the person keyed by id for easy assertions. */
function run(people) {
  const out = computeStatuses(people);
  const byId = new Map(out.map((p) => [p.id, p]));
  return (id) => byId.get(id);
}

describe('StatusEngine — own answer wins (INH-1)', () => {
  it('INH-1: answer YES → Has XLH, 100%', () => {
    const get = run([person({ id: 'a', answer: YES })]);
    expect(get('a').result).toBe(HAS);
    expect(get('a').chance).toBe(100);
  });

  it('INH-1: answer NO → No XLH, 0%', () => {
    const get = run([person({ id: 'a', answer: NO })]);
    expect(get('a').result).toBe(NO_XLH);
    expect(get('a').chance).toBe(0);
  });

  it('INH-1: a NO child of a HAS mother stays No XLH (own answer wins)', () => {
    const get = run([
      person({ id: 'mom', sex: FEMALE, answer: YES }),
      person({ id: 'kid', sex: FEMALE, answer: NO, parentIds: ['mom'] }),
    ]);
    expect(get('kid').result).toBe(NO_XLH);
    expect(get('kid').chance).toBe(0);
  });
});

describe('StatusEngine — affected father (INH-3, INH-4)', () => {
  const family = () => [
    person({ id: 'dad', sex: MALE, answer: YES }),
    person({ id: 'mum', sex: FEMALE, answer: NO }),
    person({ id: 'daughter', sex: FEMALE, answer: UNSURE, parentIds: ['dad', 'mum'] }),
    person({ id: 'son', sex: MALE, answer: UNSURE, parentIds: ['dad', 'mum'] }),
  ];

  it('INH-3: unsure daughter of affected father → Has XLH, 100%', () => {
    const get = run(family());
    expect(get('daughter').result).toBe(HAS);
    expect(get('daughter').chance).toBe(100);
  });

  it('INH-4: unsure son of affected father (clear mother) → No XLH, 0%', () => {
    const get = run(family());
    expect(get('son').result).toBe(NO_XLH);
    expect(get('son').chance).toBe(0);
  });
});

describe('StatusEngine — affected mother (INH-5)', () => {
  it('INH-5: unsure daughter of affected mother → May have XLH, 50%', () => {
    const get = run([
      person({ id: 'mom', sex: FEMALE, answer: YES }),
      person({ id: 'd', sex: FEMALE, answer: UNSURE, parentIds: ['mom'] }),
    ]);
    expect(get('d').result).toBe(MAY_HAVE);
    expect(get('d').chance).toBe(50);
  });

  it('INH-5: unsure son of affected mother → May have XLH, 50%', () => {
    const get = run([
      person({ id: 'mom', sex: FEMALE, answer: YES }),
      person({ id: 's', sex: MALE, answer: UNSURE, parentIds: ['mom'] }),
    ]);
    expect(get('s').result).toBe(MAY_HAVE);
    expect(get('s').chance).toBe(50);
  });

  it('INH-5/INH-8: son of BOTH affected parents → 50% (from mother, not 0 from father)', () => {
    const get = run([
      person({ id: 'dad', sex: MALE, answer: YES }),
      person({ id: 'mom', sex: FEMALE, answer: YES }),
      person({ id: 's', sex: MALE, answer: UNSURE, parentIds: ['dad', 'mom'] }),
    ]);
    expect(get('s').result).toBe(MAY_HAVE);
    expect(get('s').chance).toBe(50);
  });
});

describe('StatusEngine — uncertain parent does not quantify (INH-6)', () => {
  it('INH-6: child of a May-have (unquantified) parent → May have XLH, no %', () => {
    const get = run([
      person({ id: 'gma', sex: FEMALE, answer: YES }),
      // aunt is unsure daughter of affected grandmother → May have 50
      person({ id: 'aunt', sex: FEMALE, answer: UNSURE, parentIds: ['gma'] }),
      // cousin is unsure child of the 50% aunt → May have, null
      person({ id: 'cousin', sex: MALE, answer: UNSURE, parentIds: ['aunt'] }),
    ]);
    expect(get('aunt').chance).toBe(50);
    expect(get('cousin').result).toBe(MAY_HAVE);
    expect(get('cousin').chance).toBeNull();
  });
});

describe('StatusEngine — no affected lineage (INH-7)', () => {
  it('INH-7: unsure person with clear/absent parents → May have XLH, no %', () => {
    const get = run([person({ id: 'a', sex: FEMALE, answer: UNSURE })]);
    expect(get('a').result).toBe(MAY_HAVE);
    expect(get('a').chance).toBeNull();
  });

  it('INH-7: unanswered person with no affected lineage → No XLH, 0%', () => {
    const get = run([person({ id: 'a', sex: MALE, answer: null })]);
    expect(get('a').result).toBe(NO_XLH);
    expect(get('a').chance).toBe(0);
  });
});

describe('StatusEngine — males are never partial carriers (INH-8)', () => {
  it('INH-8: a male is never assigned a non-50 carrier fraction; quantified male is 0/50/100 or null', () => {
    const get = run([
      person({ id: 'gma', sex: FEMALE, answer: UNSURE }), // may have, null
      person({ id: 'son', sex: MALE, answer: UNSURE, parentIds: ['gma'] }),
    ]);
    const s = get('son');
    expect([HAS, MAY_HAVE, NO_XLH]).toContain(s.result);
    expect([0, 50, 100, null]).toContain(s.chance);
  });
});

describe('StatusEngine — determinism (INH-10)', () => {
  it('INH-10: result is independent of input ordering and idempotent', () => {
    const build = () => [
      person({ id: 'mom', sex: FEMALE, answer: YES }),
      person({ id: 'kid', sex: FEMALE, answer: UNSURE, parentIds: ['mom'] }),
    ];
    const ordered = run(build())('kid');
    const reversed = run(build().reverse())('kid');
    expect(reversed.result).toBe(ordered.result);
    expect(reversed.chance).toBe(ordered.chance);

    // idempotent: a second pass over already-computed people is stable
    const people = computeStatuses(build());
    const first = JSON.stringify(people);
    const second = JSON.stringify(computeStatuses(people));
    expect(second).toBe(first);
  });
});

describe('StatusEngine — display strings (INH-11)', () => {
  it('INH-11: label formatting per result + chance', () => {
    expect(statusLabel({ result: HAS, chance: 100 })).toMatch(/^Has XLH/);
    expect(statusLabel({ result: HAS, chance: 100 })).toContain('100%');
    expect(statusLabel({ result: MAY_HAVE, chance: 50 })).toBe('May have XLH (50% chance)');
    expect(statusLabel({ result: MAY_HAVE, chance: null })).toBe('May have XLH');
    expect(statusLabel({ result: NO_XLH, chance: 0 })).toMatch(/^No XLH/);
  });
});

// The canonical example family from PDF p14 — every cell must reproduce.
describe('StatusEngine — PDF p14 reference family', () => {
  function p14Family() {
    return [
      person({ id: 'grandmother', sex: FEMALE, answer: YES }),
      person({ id: 'mom', sex: FEMALE, answer: YES, parentIds: ['grandmother'] }),
      person({ id: 'maria', sex: FEMALE, answer: UNSURE, parentIds: ['grandmother'] }), // aunt
      person({ id: 'eric', sex: MALE, answer: UNSURE, parentIds: ['maria'] }),          // cousin
      person({ id: 'amy', sex: FEMALE, answer: YES, parentIds: ['mom'] }),              // proband
      person({ id: 'jake', sex: MALE, answer: NO, parentIds: ['mom'] }),                // sibling
      person({ id: 'alyssa', sex: FEMALE, answer: NO, parentIds: ['mom'] }),            // sibling
      person({ id: 'alex', sex: MALE, answer: NO }),                                    // partner
      person({ id: 'david', sex: MALE, answer: UNSURE, parentIds: ['amy', 'alex'] }),   // child
      person({ id: 'emily', sex: FEMALE, answer: NO, parentIds: ['amy', 'alex'] }),     // child
    ];
  }

  const expected = {
    amy: [HAS, 100],
    alex: [NO_XLH, 0],
    david: [MAY_HAVE, 50],
    emily: [NO_XLH, 0],
    mom: [HAS, 100],
    maria: [MAY_HAVE, 50],
    eric: [MAY_HAVE, null],
    jake: [NO_XLH, 0],
    alyssa: [NO_XLH, 0],
    grandmother: [HAS, 100],
  };

  it('reproduces every p14 status & percentage', () => {
    const get = run(p14Family());
    for (const [id, [result, chance]] of Object.entries(expected)) {
      expect(get(id).result, `${id} result`).toBe(result);
      expect(get(id).chance, `${id} chance`).toBe(chance);
    }
  });
});
