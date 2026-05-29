import { SEX, XLH_ANSWER, XLH_RESULT } from '../data/constants.js';

// Deterministic XLH status engine. Pure: no DOM, no I/O. Turns each person's raw
// answer + lineage into a { result, chance } display status.
// Spec: specs/02-inheritance-logic.md (INH-1..11).

const { MALE, FEMALE } = SEX;
const { YES, NO, UNSURE } = XLH_ANSWER;
const { HAS, MAY_HAVE, NO: NO_XLH } = XLH_RESULT;

/**
 * Compute { result, chance } for every person, in place and returned.
 * Pure & idempotent; order-independent (parents resolved on demand, memoized).
 * @param {Array<{id, sex, answer, parentIds?}>} people
 * @returns {Array} the same array, each person annotated with result + chance
 */
export function computeStatuses(people) {
  const byId = new Map(people.map((p) => [p.id, p]));
  const memo = new Map();

  function resolve(person) {
    if (memo.has(person.id)) return memo.get(person.id);
    // provisional value guards against cyclic parentIds (acyclic in practice)
    memo.set(person.id, { result: MAY_HAVE, chance: null });

    const res = compute(person);
    memo.set(person.id, res);
    return res;
  }

  function compute(person) {
    // INH-1 — own answer wins
    if (person.answer === YES) return { result: HAS, chance: 100 };
    if (person.answer === NO) return { result: NO_XLH, chance: 0 };

    // INH-2 — infer for UNSURE / unanswered from parents
    const parents = (person.parentIds || []).map((id) => byId.get(id)).filter(Boolean);
    const mother = parents.find((p) => p.sex === FEMALE);
    const father = parents.find((p) => p.sex === MALE);
    const m = mother ? resolve(mother) : null;
    const f = father ? resolve(father) : null;

    const motherHas = m?.result === HAS;
    const fatherHas = f?.result === HAS;
    const motherMay = m?.result === MAY_HAVE;
    const fatherMay = f?.result === MAY_HAVE;
    const isUnsure = person.answer === UNSURE;

    if (person.sex === MALE) {
      // A son's X is maternal; the father never makes a son a carrier (INH-8).
      if (motherHas) return { result: MAY_HAVE, chance: 50 };          // INH-5
      if (fatherHas) return { result: NO_XLH, chance: 0 };             // INH-4 (mother clear)
      if (motherMay) return { result: MAY_HAVE, chance: null };        // INH-6
      return isUnsure ? { result: MAY_HAVE, chance: null }            // INH-7
                      : { result: NO_XLH, chance: 0 };
    }

    // Female
    if (fatherHas) return { result: HAS, chance: 100 };               // INH-3
    if (motherHas) return { result: MAY_HAVE, chance: 50 };           // INH-5
    if (motherMay || fatherMay) return { result: MAY_HAVE, chance: null }; // INH-6
    return isUnsure ? { result: MAY_HAVE, chance: null }             // INH-7
                    : { result: NO_XLH, chance: 0 };
  }

  for (const person of people) {
    const { result, chance } = resolve(person);
    person.result = result;
    person.chance = chance;
  }
  return people;
}

/**
 * Human-readable status label (INH-11). Categorical in the UI; the PDF table adds %.
 * @param {{result: string, chance: number|null}} status
 */
export function statusLabel({ result, chance }) {
  if (result === HAS) return chance === 100 ? 'Has XLH (100%)' : 'Has XLH';
  if (result === MAY_HAVE) return chance === 50 ? 'May have XLH (50% chance)' : 'May have XLH';
  if (result === NO_XLH) return chance === 0 ? 'No XLH (0% chance)' : 'No XLH';
  return '';
}
