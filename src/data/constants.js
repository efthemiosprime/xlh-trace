export const SEX = {
  MALE: 'male',
  FEMALE: 'female',
};

// Legacy status model (old engine/UI). Superseded by XLH_ANSWER + XLH_RESULT below;
// kept until the old wizard/tree-builder UI is retired in Phase 4.
export const XLH_STATUS = {
  AFFECTED: 'affected',
  UNAFFECTED: 'unaffected',
  UNKNOWN: 'unknown',
};

// New model (specs/01-domain-model.md). Raw user input:
export const XLH_ANSWER = {
  YES: 'yes',
  NO: 'no',
  UNSURE: 'unsure',
};

// Engine-computed result for display (specs/02-inheritance-logic.md, INH-*):
export const XLH_RESULT = {
  HAS: 'has_xlh',
  MAY_HAVE: 'may_have_xlh',
  NO: 'no_xlh',
};

export const RELATIONSHIP = {
  PROBAND: 'proband',
  PARTNER: 'partner',
  CHILD: 'child',
  SIBLING: 'sibling',
  PARENT: 'parent',
  AUNT_UNCLE: 'aunt_uncle',
  GRANDPARENT: 'grandparent',
  COUSIN: 'cousin',
  NIBLING: 'nibling',
  SPOUSE: 'spouse', // legacy alias for PARTNER (old UI); retire in Phase 4
};

// DM-5 — symptom catalog (groups + items). Stored on a person as group ids.
export const SYMPTOM_GROUPS = [
  { id: 'growth', label: 'Changes in growth and development',
    items: ['Shorter than average height', 'Weakening of growing bones (rickets)'] },
  { id: 'bone', label: 'Bone weakness and broken bones',
    items: ['Weakening of mature bone (osteomalacia)',
            'Broken bones (fractures) / areas of weakened bone that are not completely broken (pseudofractures)'] },
  { id: 'joint', label: 'Joint and tendon issues',
    items: ['Joint damage (osteoarthritis)', 'Hardening of tissue attaching bones and muscles (enthesopathy)'] },
  { id: 'walking', label: 'Leg and walking issues',
    items: ['Delayed walking or an unusual way of walking (gait abnormalities)', 'Bowed legs and knock knees'] },
  { id: 'pain', label: 'Pain, weakness, and fatigue',
    items: ['Bone and joint pain', 'Muscle pain and weakness', 'Fatigue'] },
  { id: 'head', label: 'Head and spine complications',
    items: ['Unusual shape of the head (craniosynostosis)', 'Narrowing of spaces in the spine (spinal stenosis)'] },
  { id: 'dental', label: 'Dental issues',
    items: ['Abscesses and tooth loss', 'Problems with the gums, like redness, swelling, or infection (periodontitis)'] },
  { id: 'hearing', label: 'Hearing issues', items: ['Hearing loss'] },
];

export const STEPS = [
  { id: 1, label: 'Who is this for?' },
  { id: 2, label: 'Spouse & Children' },
  { id: 3, label: 'Parents' },
  { id: 4, label: 'Aunts & Uncles' },
  { id: 5, label: 'Grandparents' },
  { id: 6, label: 'Your XLH Family Tree' },
];

export const GENERATION = {
  GRANDPARENT: -2,
  PARENT: -1,
  PROBAND: 0,
  CHILD: 1,
};

const RELATIONSHIP_LABELS = {
  [RELATIONSHIP.PROBAND]: 'Proband',
  [RELATIONSHIP.PARENT]: 'Parent',
  [RELATIONSHIP.GRANDPARENT]: 'Grandparent',
  [RELATIONSHIP.CHILD]: 'Child',
  [RELATIONSHIP.SPOUSE]: 'Spouse',
  [RELATIONSHIP.AUNT_UNCLE]: 'Aunt/Uncle',
};

export function relationshipLabel(person) {
  return RELATIONSHIP_LABELS[person.relationship] || 'Family Member';
}
