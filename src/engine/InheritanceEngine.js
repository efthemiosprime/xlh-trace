import { SEX, XLH_STATUS } from '../data/constants.js';

export class InheritanceEngine {
  constructor(store) {
    this.store = store;
  }

  analyze() {
    this.#resetComputed();
    this.#backwardInference();
    this.#forwardInference();
    this.#sanitizeMales();
    return this.store.getAll();
  }

  // Males have one X — they're either affected or not. Never carriers.
  #sanitizeMales() {
    for (const person of this.store.getAll()) {
      if (person.sex === SEX.MALE) {
        person.computedStatus = null;
      }
    }
  }

  #resetComputed() {
    for (const person of this.store.getAll()) {
      person.computedStatus = null;
      person.probability = null;
      person.isSpontaneous = false;
    }
  }

  // Pass 1: Bottom-up — infer carrier status from affected children
  #backwardInference() {
    const people = this.store.getAll();
    const sorted = [...people].sort((a, b) => b.generation - a.generation);

    for (const person of sorted) {
      if (person.xlhStatus !== XLH_STATUS.AFFECTED) continue;

      const parents = this.store.getParents(person.id);
      const mother = parents.find(p => p.sex === SEX.FEMALE);
      const father = parents.find(p => p.sex === SEX.MALE);

      if (person.sex === SEX.MALE) {
        // Affected male: his single X comes from mother → mother MUST be carrier
        if (mother && mother.xlhStatus !== XLH_STATUS.AFFECTED) {
          if (!mother.computedStatus || mother.computedStatus !== 'carrier_probable') {
            mother.computedStatus = 'carrier_probable';
            mother.probability = 1.0;
          }
        }
        // Father is irrelevant — males get Y from father, not X
      } else if (person.sex === SEX.FEMALE) {
        // Affected female: one X from each parent, at least one must carry mutation
        // Could be from mother OR father (or both)
        this.#inferParentFromAffectedFemale(mother, father);
      }

      // Propagate further up through carrier mothers
      if (mother && (mother.computedStatus === 'carrier_probable' || mother.xlhStatus === XLH_STATUS.AFFECTED)) {
        this.#propagateUp(mother);
      }
    }
  }

  #inferParentFromAffectedFemale(mother, father) {
    // For an affected female, she got one X from each parent.
    // At least one parent must have the mutated X.
    // Father: if he has it on his X, he'd be AFFECTED (males can't be silent carriers)
    // Mother: she could be a carrier (heterozygous)
    if (mother && mother.xlhStatus !== XLH_STATUS.AFFECTED && !mother.computedStatus) {
      mother.computedStatus = 'carrier_possible';
      mother.probability = Math.max(mother.probability || 0, 0.5);
    }
    // Don't mark father as "carrier" — males are either affected or not
    // Only set probability (chance he is the source = affected)
    if (father && father.xlhStatus === XLH_STATUS.UNKNOWN && !father.computedStatus) {
      father.probability = Math.max(father.probability || 0, 0.5);
      // No computedStatus — males can't be carriers for X-linked dominant
    }
  }

  #propagateUp(person) {
    const parents = this.store.getParents(person.id);
    const mother = parents.find(p => p.sex === SEX.FEMALE);
    const father = parents.find(p => p.sex === SEX.MALE);

    if (person.sex === SEX.FEMALE) {
      // Female carrier/affected: her mutated X came from mother OR father
      // Mother could be carrier; father would have to be affected (not carrier)
      if (mother && mother.xlhStatus !== XLH_STATUS.AFFECTED && !mother.computedStatus) {
        mother.computedStatus = 'carrier_possible';
        mother.probability = Math.max(mother.probability || 0, 0.5);
      }
      if (father && father.xlhStatus === XLH_STATUS.UNKNOWN && father.probability === null) {
        // Father could be the source — but he'd be affected, not carrier
        father.probability = 0.5;
      }
    } else if (person.sex === SEX.MALE) {
      // Male's X comes from mother only
      if (mother && mother.xlhStatus !== XLH_STATUS.AFFECTED && !mother.computedStatus) {
        mother.computedStatus = 'carrier_probable';
        mother.probability = 1.0;
        this.#propagateUp(mother);
      }
    }
  }

  // Pass 2: Top-down — infer child probabilities from affected/carrier parents
  #forwardInference() {
    const people = this.store.getAll();
    const sorted = [...people].sort((a, b) => a.generation - b.generation);

    for (const person of sorted) {
      const isAffected = person.xlhStatus === XLH_STATUS.AFFECTED;
      const isCarrier = person.computedStatus === 'carrier_probable' || person.computedStatus === 'carrier_possible';

      if (!isAffected && !isCarrier) continue;

      const children = this.store.getChildren(person.id);

      for (const child of children) {
        if (child.xlhStatus === XLH_STATUS.AFFECTED) continue;
        if (child.xlhStatus === XLH_STATUS.UNAFFECTED) continue;
        if (child.probability !== null) continue;

        if (person.sex === SEX.MALE && isAffected) {
          // Affected father: passes his X to ALL daughters, Y to sons
          if (child.sex === SEX.FEMALE) {
            child.computedStatus = 'carrier_probable';
            child.probability = 1.0;
          } else {
            child.probability = 0.0;
          }
        } else if (person.sex === SEX.FEMALE && (isAffected || isCarrier)) {
          // Affected/carrier mother: 50% chance per child
          const motherProb = isAffected ? 1.0 : (person.probability || 0.5);
          child.probability = motherProb * 0.5;
          if (child.probability > 0 && child.xlhStatus !== XLH_STATUS.UNAFFECTED) {
            if (child.sex === SEX.FEMALE) {
              // Daughters can be carriers
              child.computedStatus = child.probability >= 0.5 ? 'carrier_probable' : 'carrier_possible';
            } else {
              // Sons: if they inherit the X, they're affected — no carrier state
              // probability represents chance of being affected
            }
          }
        }
      }
    }
  }
}
