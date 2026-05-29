import { describe, it, expect } from 'vitest';
import { WizardFlow, STEP } from '../src/wizard/WizardFlow.js';
import { SEX, XLH_ANSWER } from '../src/data/constants.js';

const { MALE, FEMALE } = SEX;
const { YES, NO, UNSURE } = XLH_ANSWER;

/** Minimal store stand-in for the pure flow machine. */
function fakeStore({ proband = null, partner = null, count = 1, max = 50 } = {}) {
  return {
    getProband: () => proband,
    getPartner: () => partner,
    count: () => count,
    canAddPerson: () => count < max,
  };
}

const flowWith = (opts) => new WizardFlow({ store: fakeStore(opts) });

describe('WizardFlow — step order & navigation (FLOW-1)', () => {
  it('FLOW-1: starts at START and advances linearly through every step', () => {
    const f = flowWith({ proband: { sex: FEMALE, answer: YES } });
    const seen = [f.step];
    for (let i = 0; i < 8; i++) { f.next(); seen.push(f.step); }
    expect(seen.slice(0, 8)).toEqual([
      STEP.START, STEP.SELF, STEP.CHILDREN, STEP.SIBLINGS,
      STEP.PARENT, STEP.AUNTS_UNCLES, STEP.GRANDPARENTS, STEP.SUMMARY,
    ]);
  });

  it('FLOW-1: back() returns to the previous step; from START it is a no-op', () => {
    const f = flowWith({ proband: { sex: FEMALE, answer: YES } });
    expect(f.step).toBe(STEP.START);
    f.back();
    expect(f.step).toBe(STEP.START); // no-op at START
    f.next(); f.next(); // SELF → CHILDREN
    expect(f.step).toBe(STEP.CHILDREN);
    f.back();
    expect(f.step).toBe(STEP.SELF);
  });

  it('FLOW-1: SUMMARY is terminal — next() is a no-op', () => {
    const f = flowWith({ proband: { sex: FEMALE, answer: YES } });
    f.goTo(STEP.SUMMARY);
    f.next();
    expect(f.step).toBe(STEP.SUMMARY);
  });
});

describe('WizardFlow — optional steps (FLOW-2)', () => {
  it('FLOW-2: children/siblings/aunts-uncles are skippable', () => {
    const f = flowWith({ proband: { sex: FEMALE, answer: YES } });
    f.next(); // SELF
    expect(f.isOptional()).toBe(false);
    f.next(); // CHILDREN
    expect(f.isOptional()).toBe(true);
    f.skip();
    expect(f.step).toBe(STEP.SIBLINGS);
  });

  it('FLOW-2: skip() on a non-optional step is a no-op', () => {
    const f = flowWith({ proband: { sex: FEMALE, answer: YES } });
    f.next(); // SELF (required)
    f.skip();
    expect(f.step).toBe(STEP.SELF);
  });
});

describe('WizardFlow — partner-side shift (FLOW-3, FLOW-4)', () => {
  it('FLOW-3: proband No + partner Yes/Unsure → focus shifts to partner', () => {
    const f = flowWith({
      proband: { sex: FEMALE, answer: NO, name: 'Amy' },
      partner: { sex: MALE, answer: YES, name: 'Alex' },
    });
    f.next(); // SELF
    f.next(); // leaving SELF evaluates focus
    expect(f.focusPerson).toBe('partner');
  });

  it('FLOW-3: proband affected → focus stays self', () => {
    const f = flowWith({
      proband: { sex: FEMALE, answer: YES, name: 'Amy' },
      partner: { sex: MALE, answer: YES, name: 'Alex' },
    });
    f.next(); f.next();
    expect(f.focusPerson).toBe('self');
  });

  it('FLOW-3: proband No but partner not affected → stays self', () => {
    const f = flowWith({
      proband: { sex: FEMALE, answer: NO, name: 'Amy' },
      partner: { sex: MALE, answer: NO, name: 'Alex' },
    });
    f.next(); f.next();
    expect(f.focusPerson).toBe('self');
  });

  it('FLOW-4: subjectName reflects the focus person', () => {
    const f = flowWith({
      proband: { sex: FEMALE, answer: NO, name: 'Amy' },
      partner: { sex: MALE, answer: UNSURE, name: 'Alex' },
    });
    f.next(); f.next();
    expect(f.subjectName()).toBe('Alex');
  });
});

describe('WizardFlow — parent chooser (FLOW-5, FLOW-5a)', () => {
  it('FLOW-5: selecting Mom/Dad records the chosen parent', () => {
    const f = flowWith({ proband: { sex: FEMALE, answer: YES } });
    f.goTo(STEP.PARENT);
    f.selectParent('mom');
    expect(f.chosenParent).toBe('mom');
    expect(f.step).toBe(STEP.PARENT); // detail sub-screen; advance via next()
  });

  it('FLOW-5: Neither / I don\'t know ends the experience → SUMMARY', () => {
    const f = flowWith({ proband: { sex: FEMALE, answer: YES } });
    f.goTo(STEP.PARENT);
    f.selectParent('neither');
    expect(f.isEnded).toBe(true);
    expect(f.step).toBe(STEP.SUMMARY);
  });

  it('FLOW-5a: Dad is disabled for a male focus person with XLH/Unsure', () => {
    const male = flowWith({ proband: { sex: MALE, answer: YES } });
    expect(male.canSelectParent('dad')).toBe(false);
    expect(male.canSelectParent('mom')).toBe(true);

    const unsure = flowWith({ proband: { sex: MALE, answer: UNSURE } });
    expect(unsure.canSelectParent('dad')).toBe(false);

    const female = flowWith({ proband: { sex: FEMALE, answer: YES } });
    expect(female.canSelectParent('dad')).toBe(true);
  });

  it('FLOW-5a: selectParent("dad") is ignored when disabled', () => {
    const f = flowWith({ proband: { sex: MALE, answer: YES } });
    f.goTo(STEP.PARENT);
    f.selectParent('dad');
    expect(f.chosenParent).toBeNull();
  });
});

describe('WizardFlow — grandparent chooser (FLOW-6, FLOW-6a)', () => {
  it('FLOW-6: grandparentSide derives from the chosen parent', () => {
    const mom = flowWith({ proband: { sex: FEMALE, answer: YES } });
    mom.goTo(STEP.PARENT); mom.selectParent('mom');
    expect(mom.grandparentSide()).toBe('maternal');

    const dad = flowWith({ proband: { sex: FEMALE, answer: YES } });
    dad.goTo(STEP.PARENT); dad.selectParent('dad');
    expect(dad.grandparentSide()).toBe('paternal');
  });

  it('FLOW-6: Neither / IDK at grandparents ends the experience', () => {
    const f = flowWith({ proband: { sex: FEMALE, answer: YES } });
    f.goTo(STEP.GRANDPARENTS);
    f.selectGrandparent('idk');
    expect(f.isEnded).toBe(true);
    expect(f.step).toBe(STEP.SUMMARY);
  });

  it('FLOW-6a: ending at the parent step never reaches grandparents', () => {
    const f = flowWith({ proband: { sex: FEMALE, answer: YES } });
    f.goTo(STEP.PARENT);
    f.selectParent('idk');
    expect(f.step).toBe(STEP.SUMMARY);
    f.next();
    expect(f.step).toBe(STEP.SUMMARY); // terminal, grandparents skipped
  });
});

describe('WizardFlow — end of experience (FLOW-8)', () => {
  it('FLOW-8: end() sets isEnded and jumps to SUMMARY (terminal)', () => {
    const f = flowWith({ proband: { sex: FEMALE, answer: YES } });
    f.next(); // SELF
    f.end();
    expect(f.isEnded).toBe(true);
    expect(f.step).toBe(STEP.SUMMARY);
    f.next();
    expect(f.step).toBe(STEP.SUMMARY);
  });
});

describe('WizardFlow — 50-person limit (FLOW-LIMIT)', () => {
  it('FLOW-LIMIT: limitReached reflects the store', () => {
    expect(flowWith({ count: 50, max: 50 }).limitReached).toBe(true);
    expect(flowWith({ count: 49, max: 50 }).limitReached).toBe(false);
  });
});

describe('WizardFlow — view state & overlays (FLOW-STATE, FLOW-9)', () => {
  it('FLOW-STATE: openOverlay/closeOverlay tracked; back() closes overlay first', () => {
    const f = flowWith({ proband: { sex: FEMALE, answer: YES } });
    f.next(); // SELF
    f.openOverlay('add-partner');
    expect(f.overlay).toBe('add-partner');
    f.back();
    expect(f.overlay).toBeNull();
    expect(f.step).toBe(STEP.SELF); // overlay closed, did NOT step back
  });

  it('FLOW-STATE-2: subscribers are notified on transitions', () => {
    const f = flowWith({ proband: { sex: FEMALE, answer: YES } });
    let calls = 0;
    const unsub = f.subscribe(() => { calls += 1; });
    f.next();
    f.openOverlay('x');
    expect(calls).toBe(2);
    unsub();
    f.next();
    expect(calls).toBe(2); // unsubscribed
  });
});
