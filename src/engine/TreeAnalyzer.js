import { XLH_STATUS, SEX } from '../data/constants.js';

export class TreeAnalyzer {
  constructor(store) {
    this.store = store;
  }

  findOrigin() {
    const affected = this.store.getAll().filter(p => p.xlhStatus === XLH_STATUS.AFFECTED);
    if (affected.length === 0) return { origin: null, spontaneous: [] };

    let origins = [];
    let spontaneous = [];

    for (const person of affected) {
      const ancestorChain = this.#traceAncestors(person);
      const carrierAncestors = ancestorChain.filter(
        a => a.xlhStatus === XLH_STATUS.AFFECTED || a.computedStatus === 'carrier_probable'
      );

      if (carrierAncestors.length > 0) {
        // Earliest carrier/affected ancestor is the origin
        const earliest = carrierAncestors.reduce((oldest, curr) =>
          curr.generation < oldest.generation ? curr : oldest
        );
        origins.push(earliest);
      } else {
        // No carrier ancestors = spontaneous
        person.isSpontaneous = true;
        spontaneous.push(person);
      }
    }

    // Deduplicate origins
    const uniqueOrigins = [...new Map(origins.map(o => [o.id, o])).values()];
    const origin = uniqueOrigins.length > 0
      ? uniqueOrigins.reduce((oldest, curr) => curr.generation < oldest.generation ? curr : oldest)
      : null;

    return { origin, spontaneous, allOrigins: uniqueOrigins };
  }

  #traceAncestors(person, visited = new Set()) {
    if (visited.has(person.id)) return [];
    visited.add(person.id);

    const parents = this.store.getParents(person.id);
    let ancestors = [];

    for (const parent of parents) {
      ancestors.push(parent);
      ancestors.push(...this.#traceAncestors(parent, visited));
    }

    return ancestors;
  }

  generateReport() {
    const all = this.store.getAll();
    const { origin, spontaneous } = this.findOrigin();

    const affected = all.filter(p => p.xlhStatus === XLH_STATUS.AFFECTED);
    const carriers = all.filter(p => p.computedStatus === 'carrier_probable' || p.computedStatus === 'carrier_possible');

    return {
      totalMembers: all.length,
      affected,
      carriers,
      origin,
      spontaneous,
      summary: this.#buildSummary(affected, carriers, origin, spontaneous),
    };
  }

  #buildSummary(affected, carriers, origin, spontaneous) {
    const lines = [];

    lines.push(`${affected.length} family member(s) affected with XLH.`);

    if (carriers.length > 0) {
      lines.push(`${carriers.length} probable/possible carrier(s) identified.`);
    }

    if (origin) {
      lines.push(`Likely origin: ${origin.name} (${origin.xlhStatus === XLH_STATUS.AFFECTED ? 'affected' : 'carrier'}).`);
    }

    if (spontaneous.length > 0) {
      const names = spontaneous.map(p => p.name).join(', ');
      lines.push(`Possible spontaneous mutation in: ${names}.`);
    }

    return lines;
  }
}
