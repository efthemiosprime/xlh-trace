export const SEX = {
  MALE: 'male',
  FEMALE: 'female',
};

export const XLH_STATUS = {
  AFFECTED: 'affected',
  UNAFFECTED: 'unaffected',
  UNKNOWN: 'unknown',
};

export const RELATIONSHIP = {
  PROBAND: 'proband',
  CHILD: 'child',
  PARENT: 'parent',
  AUNT_UNCLE: 'aunt_uncle',
  GRANDPARENT: 'grandparent',
  SPOUSE: 'spouse',
};

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
