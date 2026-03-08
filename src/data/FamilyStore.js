import { generateId } from '../utils/id.js';
import { RELATIONSHIP, GENERATION } from './constants.js';

const STORAGE_KEY = 'xlh-family-tree';

class FamilyStore {
  #people = new Map();
  #listeners = new Set();

  constructor() {
    this.#load();
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #notify(event, data) {
    for (const listener of this.#listeners) {
      listener(event, data);
    }
    this.#save();
  }

  createPerson({ name, sex, xlhStatus, relationship, generation, parentIds = [], spouseId = null }) {
    const person = {
      id: generateId(),
      name,
      sex,
      xlhStatus,
      computedStatus: null,
      probability: null,
      relationship,
      generation,
      parentIds,
      childIds: [],
      siblingIds: [],
      spouseId,
      isSpontaneous: false,
    };
    this.#people.set(person.id, person);
    this.#notify('add', person);
    return person;
  }

  addPerson(person) {
    this.#people.set(person.id, person);
    this.#notify('add', person);
    return person;
  }

  updatePerson(id, updates) {
    const person = this.#people.get(id);
    if (!person) return null;
    Object.assign(person, updates);
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

  setParentChild(parentId, childId) {
    const parent = this.#people.get(parentId);
    const child = this.#people.get(childId);
    if (!parent || !child) return;
    if (!parent.childIds.includes(childId)) parent.childIds.push(childId);
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

  #save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.toJSON()));
    } catch (e) { /* ignore */ }
  }

  #load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        for (const person of data) {
          this.#people.set(person.id, person);
        }
      }
    } catch (e) { /* ignore */ }
  }
}

export const familyStore = new FamilyStore();
