import { SEX, XLH_ANSWER } from '../data/constants.js';

// Pure wizard flow state machine. No DOM. Drives step order, family-side focus,
// chooser selection, end-of-experience exits, the 50-person limit, overlays, and a
// back stack (single page → no URL router). Spec: specs/03-wizard-flow.md (FLOW-*).

export const STEP = {
  START: 'start',
  SELF: 'self',
  CHILDREN: 'children',
  SIBLINGS: 'siblings',
  PARENT: 'parent',
  AUNTS_UNCLES: 'aunts_uncles',
  GRANDPARENTS: 'grandparents',
  SUMMARY: 'summary',
};

const ORDER = [
  STEP.START, STEP.SELF, STEP.CHILDREN, STEP.SIBLINGS,
  STEP.PARENT, STEP.AUNTS_UNCLES, STEP.GRANDPARENTS, STEP.SUMMARY,
];
const OPTIONAL = new Set([STEP.CHILDREN, STEP.SIBLINGS, STEP.AUNTS_UNCLES]);

const isAffected = (p) => p && (p.answer === XLH_ANSWER.YES || p.answer === XLH_ANSWER.UNSURE);

export class WizardFlow {
  #store;
  #step = STEP.START;
  #focus = 'self';
  #ended = false;
  #chosenParent = null;
  #overlay = null;
  #stack = [];
  #subs = new Set();

  constructor({ store } = {}) {
    this.#store = store ?? {};
  }

  // ---- read-only view state (FLOW-STATE) ----
  get step() { return this.#step; }
  get focusPerson() { return this.#focus; }
  get isEnded() { return this.#ended; }
  get chosenParent() { return this.#chosenParent; }
  get overlay() { return this.#overlay; }
  get limitReached() {
    return typeof this.#store.canAddPerson === 'function' ? !this.#store.canAddPerson() : false;
  }
  get state() {
    return {
      step: this.#step,
      overlay: this.#overlay,
      focusPerson: this.#focus,
      isEnded: this.#ended,
      chosenParent: this.#chosenParent,
    };
  }

  isOptional(step = this.#step) { return OPTIONAL.has(step); }

  // ---- subscriptions ----
  subscribe(fn) { this.#subs.add(fn); return () => this.#subs.delete(fn); }
  #notify() { for (const fn of this.#subs) fn(this.state); }

  #snapshot() {
    return {
      step: this.#step, focus: this.#focus, ended: this.#ended,
      chosenParent: this.#chosenParent, overlay: this.#overlay,
    };
  }
  #transition(step) {
    this.#stack.push(this.#snapshot());
    this.#step = step;
    this.#notify();
  }

  // ---- navigation (FLOW-1, FLOW-2) ----
  next() {
    if (this.#ended || this.#step === STEP.SUMMARY) return;
    if (this.#step === STEP.SELF) this.#evaluateFocus();   // FLOW-3
    const i = ORDER.indexOf(this.#step);
    this.#transition(ORDER[Math.min(i + 1, ORDER.length - 1)]);
  }

  skip() {
    if (!this.isOptional()) return;                         // FLOW-2: optional only
    this.next();
  }

  back() {
    if (this.#overlay) { this.closeOverlay(); return; }     // close overlay first
    const prev = this.#stack.pop();
    if (!prev) return;                                      // at START → no-op
    this.#step = prev.step;
    this.#focus = prev.focus;
    this.#ended = prev.ended;
    this.#chosenParent = prev.chosenParent;
    this.#overlay = prev.overlay;
    this.#notify();
  }

  goTo(step) {
    if (ORDER.includes(step)) this.#transition(step);
  }

  // ---- family-side focus (FLOW-3, FLOW-4) ----
  #evaluateFocus() {
    const proband = this.#store.getProband?.();
    const partner = this.#store.getPartner?.();
    this.#focus = proband && proband.answer === XLH_ANSWER.NO && isAffected(partner)
      ? 'partner'
      : 'self';
  }

  #focusRecord() {
    return this.#focus === 'partner' ? this.#store.getPartner?.() : this.#store.getProband?.();
  }

  subjectName() {
    const p = this.#focusRecord();
    return p?.name || (this.#focus === 'partner' ? 'your partner' : 'you');
  }

  // ---- parent chooser (FLOW-5, FLOW-5a) ----
  canSelectParent(which) {
    if (which !== 'dad') return true;
    const fp = this.#focusRecord();                         // FLOW-5a: males inherit only from mom
    return !(fp && fp.sex === SEX.MALE && isAffected(fp));
  }

  selectParent(which) {
    if (this.#step !== STEP.PARENT) return;
    if (which === 'neither' || which === 'idk') return this.end();   // FLOW-5 → end
    if (which === 'dad' && !this.canSelectParent('dad')) return;     // FLOW-5a → ignored
    if (which === 'mom' || which === 'dad') { this.#chosenParent = which; this.#notify(); }
  }

  // ---- grandparent chooser (FLOW-6, FLOW-6a) ----
  grandparentSide() {
    if (this.#chosenParent === 'mom') return 'maternal';
    if (this.#chosenParent === 'dad') return 'paternal';
    return null;
  }

  selectGrandparent(which) {
    if (this.#step !== STEP.GRANDPARENTS) return;
    if (which === 'neither' || which === 'idk') return this.end();   // FLOW-6 → end
    this.#notify();                                                  // recorded; advance via next()
  }

  // ---- end of experience (FLOW-8) ----
  end() {
    this.#stack.push(this.#snapshot());
    this.#ended = true;
    this.#step = STEP.SUMMARY;
    this.#notify();
  }

  // ---- overlays (FLOW-9) ----
  openOverlay(name) { this.#overlay = name; this.#notify(); }
  closeOverlay() { this.#overlay = null; this.#notify(); }
}
