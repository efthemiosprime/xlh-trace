import { h } from '../../utils/dom.js';
import { PersonForm } from '../shared/PersonForm.js';
import { familyStore } from '../../data/FamilyStore.js';
import { RELATIONSHIP, GENERATION, XLH_STATUS } from '../../data/constants.js';

export function StepProband({ onNext }) {
  const existing = familyStore.getProband();

  const form = PersonForm({
    name: existing?.name || '',
    sex: existing?.sex || '',
    xlhStatus: existing?.xlhStatus || XLH_STATUS.AFFECTED,
    nameLabel: 'Your name (or the person with XLH)',
  });

  form.addEventListener('change', updateStore);
  form.addEventListener('input', updateStore);

  function updateStore() {
    const values = form.getValues();
    if (!form.isValid()) return;

    // Always re-check the store for existing proband
    const current = familyStore.getProband();
    if (current) {
      familyStore.updatePerson(current.id, values);
    } else {
      familyStore.createPerson({
        ...values,
        relationship: RELATIONSHIP.PROBAND,
        generation: GENERATION.PROBAND,
      });
    }
  }

  return h('div', {}, [
    h('h2', {}, 'Who is this for?'),
    h('p', { className: 'step-description' }, 'Start by entering information about the primary person. This is usually the person diagnosed with XLH.'),
    form,
  ]);
}
