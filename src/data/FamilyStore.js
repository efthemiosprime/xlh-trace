import { generateId } from '../utils/id.js';
import { RELATIONSHIP, XLH_ANSWER } from './constants.js';

const MAX_PEOPLE = 50; // DM-8

// In-memory family store with pub/sub (DM-6..10). No persistence (DM-10/EMBED-2).
export class FamilyStore {
  #people = new Map();
  #listeners = new Set();

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #notify(event, data) {
    for (const listener of this.#listeners) {
      listener(event, data);
    }
  }

  count() { return this.#people.size; }
  canAddPerson() { return this.#people.size < MAX_PEOPLE; } // DM-8

  createPerson(attrs = {}) {
    if (!this.canAddPerson()) return null; // DM-8
    const {
      name = '', sex, answer = null, symptoms = [],
      relationship, generation, parentIds = [], spouseId = null,
    } = attrs;
    const person = {
      id: generateId(),
      name,
      sex,
      answer,
      symptoms: answer === XLH_ANSWER.NO ? [] : [...symptoms], // DM-7
      result: null,
      chance: null,
      relationship,
      generation,
      parentIds: [...parentIds],
      childIds: [],
      siblingIds: [],
      spouseId,
      // legacy fields, kept until the old UI is retired in Phase 4:
      xlhStatus: attrs.xlhStatus ?? null,
      computedStatus: null,
      probability: null,
      isSpontaneous: false,
    };
    this.#people.set(person.id, person);
    this.#notify('add', person);
    return person;
  }

  addPerson(person) {
    if (!this.canAddPerson()) return null; // DM-8
    this.#people.set(person.id, person);
    this.#notify('add', person);
    return person;
  }

  updatePerson(id, updates) {
    const person = this.#people.get(id);
    if (!person) return null;
    Object.assign(person, updates);
    if (person.answer === XLH_ANSWER.NO) person.symptoms = []; // DM-7
    this.#notify('update', person);
    return person;
  }

  removePerson(id) {
    const person = this.#people.get(id);
    if (!person) return;

    // Clean up references
    for (const p of this.#people.values()) {
      p.parentIds = p.parentIds.filter(pid => pid !== id);
      p.childIds = p.childIds.filter(cid => cid !== id);
      if (p.siblingIds) p.siblingIds = p.siblingIds.filter(sid => sid !== id);
      if (p.spouseId === id) p.spouseId = null;
    }

    this.#people.delete(id);
    this.#notify('remove', person);
  }

  getPerson(id) {
    return this.#people.get(id) || null;
  }

  getProband() {
    for (const p of this.#people.values()) {
      if (p.relationship === RELATIONSHIP.PROBAND) return p;
    }
    return null;
  }

  getPartner() {
    const proband = this.getProband();
    if (proband?.spouseId) {
      const spouse = this.#people.get(proband.spouseId);
      if (spouse) return spouse;
    }
    for (const p of this.#people.values()) {
      if (p.relationship === RELATIONSHIP.PARTNER || p.relationship === RELATIONSHIP.SPOUSE) return p;
    }
    return null;
  }

  getChildren(id) {
    const person = this.#people.get(id);
    if (!person) return [];
    return person.childIds.map(cid => this.#people.get(cid)).filter(Boolean);
  }

  getParents(id) {
    const person = this.#people.get(id);
    if (!person) return [];
    return person.parentIds.map(pid => this.#people.get(pid)).filter(Boolean);
  }

  getSiblings(id) {
    const person = this.#people.get(id);
    if (!person) return [];
    const siblings = new Set();
    // Via shared parents
    for (const pid of person.parentIds) {
      const parent = this.#people.get(pid);
      if (parent) {
        for (const cid of parent.childIds) {
          if (cid !== id) siblings.add(cid);
        }
      }
    }
    // Via explicit sibling links
    if (person.siblingIds) {
      for (const sid of person.siblingIds) {
        siblings.add(sid);
      }
    }
    return [...siblings].map(sid => this.#people.get(sid)).filter(Boolean);
  }

  setSibling(id1, id2) {
    const p1 = this.#people.get(id1);
    const p2 = this.#people.get(id2);
    if (!p1 || !p2) return;
    if (!p1.siblingIds) p1.siblingIds = [];
    if (!p2.siblingIds) p2.siblingIds = [];
    if (!p1.siblingIds.includes(id2)) p1.siblingIds.push(id2);
    if (!p2.siblingIds.includes(id1)) p2.siblingIds.push(id1);
    this.#notify('relationship', { siblingIds: [id1, id2] });
  }

  getByGeneration(gen) {
    return [...this.#people.values()].filter(p => p.generation === gen);
  }

  getByRelationship(rel) {
    return [...this.#people.values()].filter(p => p.relationship === rel);
  }

  getAll() {
    return [...this.#people.values()];
  }

  setParentChild(parentId, childId, { before } = {}) {
    const parent = this.#people.get(parentId);
    const child = this.#people.get(childId);
    if (!parent || !child) return;
    if (!parent.childIds.includes(childId)) {
      if (before) {
        const idx = parent.childIds.indexOf(before);
        if (idx >= 0) {
          parent.childIds.splice(idx, 0, childId);
        } else {
          parent.childIds.push(childId);
        }
      } else {
        parent.childIds.push(childId);
      }
    }
    if (!child.parentIds.includes(parentId)) child.parentIds.push(parentId);
    this.#notify('relationship', { parentId, childId });
  }

  setSpouse(id1, id2) {
    const p1 = this.#people.get(id1);
    const p2 = this.#people.get(id2);
    if (!p1 || !p2) return;
    p1.spouseId = id2;
    p2.spouseId = id1;
    this.#notify('relationship', { spouseIds: [id1, id2] });
  }

  clear() {
    this.#people.clear();
    this.#notify('clear', null);
  }

  toJSON() {
    return [...this.#people.values()];
  }

  fromJSON(data) {
    this.#people.clear();
    for (const person of data) {
      this.#people.set(person.id, person);
    }
    this.#notify('load', null);
  }
}

// Shared singleton for app use. Tests construct their own `new FamilyStore()`.
export const familyStore = new FamilyStore();
