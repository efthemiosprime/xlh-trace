import { describe, it, expect, afterEach } from 'vitest';
import { FamilyStore } from '../src/data/FamilyStore.js';
import { SEX, XLH_ANSWER, RELATIONSHIP, GENERATION } from '../src/data/constants.js';

const { MALE, FEMALE } = SEX;
const { YES, NO, UNSURE } = XLH_ANSWER;

function proband(store, attrs = {}) {
  return store.createPerson({
    name: 'Amy', sex: FEMALE, answer: YES,
    relationship: RELATIONSHIP.PROBAND, generation: GENERATION.PROBAND, ...attrs,
  });
}

describe('FamilyStore — new person model (DM-6)', () => {
  it('DM-6: createPerson seeds new-model fields', () => {
    const s = new FamilyStore();
    const p = proband(s, { symptoms: ['growth'] });
    expect(p.answer).toBe(YES);
    expect(p.symptoms).toEqual(['growth']);
    expect(p.result).toBeNull();
    expect(p.chance).toBeNull();
    expect(p.relationship).toBe(RELATIONSHIP.PROBAND);
  });
});

describe('FamilyStore — symptoms gating (DM-7)', () => {
  it('DM-7: answer NO clears symptoms at create', () => {
    const s = new FamilyStore();
    const p = s.createPerson({ name: 'X', sex: MALE, answer: NO, symptoms: ['a', 'b'],
      relationship: RELATIONSHIP.CHILD, generation: 1 });
    expect(p.symptoms).toEqual([]);
  });

  it('DM-7: updating answer to NO clears symptoms', () => {
    const s = new FamilyStore();
    const p = proband(s, { answer: UNSURE, symptoms: ['a'] });
    s.updatePerson(p.id, { answer: NO });
    expect(s.getPerson(p.id).symptoms).toEqual([]);
  });

  it('DM-7: symptoms persist for Yes/Unsure', () => {
    const s = new FamilyStore();
    const p = proband(s, { answer: UNSURE, symptoms: ['a'] });
    expect(s.getPerson(p.id).symptoms).toEqual(['a']);
  });
});

describe('FamilyStore — queries (DM-9)', () => {
  it('DM-9: getProband / getPartner', () => {
    const s = new FamilyStore();
    const me = proband(s);
    const partner = s.createPerson({ name: 'Alex', sex: MALE, answer: NO,
      relationship: RELATIONSHIP.PARTNER, generation: 0 });
    s.setSpouse(me.id, partner.id);
    expect(s.getProband().id).toBe(me.id);
    expect(s.getPartner().id).toBe(partner.id);
  });

  it('DM-9: getParents / getChildren via setParentChild', () => {
    const s = new FamilyStore();
    const me = proband(s);
    const child = s.createPerson({ name: 'Kid', sex: FEMALE, answer: UNSURE,
      relationship: RELATIONSHIP.CHILD, generation: 1 });
    s.setParentChild(me.id, child.id);
    expect(s.getChildren(me.id).map((c) => c.id)).toContain(child.id);
    expect(s.getParents(child.id).map((p) => p.id)).toContain(me.id);
  });

  it('DM-9: removePerson cleans up dangling references', () => {
    const s = new FamilyStore();
    const me = proband(s);
    const partner = s.createPerson({ name: 'Alex', sex: MALE, answer: NO,
      relationship: RELATIONSHIP.PARTNER, generation: 0 });
    const child = s.createPerson({ name: 'Kid', sex: FEMALE, answer: NO,
      relationship: RELATIONSHIP.CHILD, generation: 1 });
    s.setSpouse(me.id, partner.id);
    s.setParentChild(me.id, child.id);

    s.removePerson(partner.id);
    expect(s.getPerson(me.id).spouseId).toBeNull();

    s.removePerson(me.id);
    expect(s.getPerson(child.id).parentIds).not.toContain(me.id);
  });

  it('DM-9: count reflects the number of people', () => {
    const s = new FamilyStore();
    expect(s.count()).toBe(0);
    proband(s);
    expect(s.count()).toBe(1);
  });
});

describe('FamilyStore — 50-person limit (DM-8)', () => {
  it('DM-8: canAddPerson is false at 50 and adds beyond are rejected', () => {
    const s = new FamilyStore();
    for (let i = 0; i < 50; i++) {
      s.createPerson({ name: `P${i}`, sex: MALE, answer: NO, relationship: RELATIONSHIP.COUSIN, generation: 1 });
    }
    expect(s.count()).toBe(50);
    expect(s.canAddPerson()).toBe(false);
    const overflow = s.createPerson({ name: 'P50', sex: MALE, answer: NO, relationship: RELATIONSHIP.COUSIN, generation: 1 });
    expect(overflow).toBeNull();
    expect(s.count()).toBe(50);
  });

  it('DM-8: removing a person re-enables adding', () => {
    const s = new FamilyStore();
    const ids = [];
    for (let i = 0; i < 50; i++) {
      ids.push(s.createPerson({ name: `P${i}`, sex: MALE, answer: NO, relationship: RELATIONSHIP.COUSIN, generation: 1 }).id);
    }
    s.removePerson(ids[0]);
    expect(s.canAddPerson()).toBe(true);
    expect(s.createPerson({ name: 'new', sex: FEMALE, answer: NO, relationship: RELATIONSHIP.COUSIN, generation: 1 })).not.toBeNull();
  });
});

describe('FamilyStore — in-memory only, no persistence (DM-10)', () => {
  afterEach(() => { delete globalThis.localStorage; });

  it('DM-10: never writes to localStorage', () => {
    const writes = [];
    globalThis.localStorage = {
      setItem: (...a) => writes.push(a),
      getItem: () => null,
      removeItem: () => {},
    };
    const s = new FamilyStore();
    proband(s);
    expect(writes.length).toBe(0);
  });

  it('DM-10: a fresh store starts empty (no auto-load)', () => {
    expect(new FamilyStore().count()).toBe(0);
  });
});
