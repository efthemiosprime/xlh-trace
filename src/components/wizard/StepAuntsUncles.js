import { h } from '../../utils/dom.js';
import { PersonForm } from '../shared/PersonForm.js';
import { PersonList } from '../shared/PersonList.js';
import { Modal } from '../shared/Modal.js';
import { familyStore } from '../../data/FamilyStore.js';
import { RELATIONSHIP, GENERATION, SEX } from '../../data/constants.js';

export function StepAuntsUncles() {
  const proband = familyStore.getProband();
  const parents = familyStore.getParents(proband.id);
  const container = h('div');

  function render() {
    container.innerHTML = '';
    container.append(
      h('h2', {}, 'Add Aunts & Uncles'),
      h('p', { className: 'step-description' }, 'Add siblings of each parent. Skip if none.'),
    );

    if (parents.length === 0) {
      container.appendChild(h('p', { style: 'color: var(--color-text-muted)' }, 'Add parents first (go back to step 3).'));
      return;
    }

    for (const parent of parents) {
      const siblingsOfParent = () => familyStore.getSiblings(parent.id);
      const label = parent.sex === SEX.FEMALE ? "Mother's" : "Father's";

      container.appendChild(h('h3', { style: 'margin: 1.25rem 0 0.5rem' }, `${label} siblings`));

      const list = PersonList({
        people: siblingsOfParent(),
        emptyText: `No siblings added for ${parent.name}.`,
        addLabel: `+ Add ${label} sibling`,
        onAdd: () => openAddModal(parent, list, siblingsOfParent),
        onEdit: (person) => openEditModal(person, list, siblingsOfParent),
        onRemove: (person) => {
          familyStore.removePerson(person.id);
          list.update(siblingsOfParent());
        },
      });

      container.appendChild(list);
    }
  }

  function openAddModal(parent, list, getSiblings) {
    const form = PersonForm();
    Modal({
      title: `Add Sibling of ${parent.name}`,
      content: form,
      onSave: () => {
        if (!form.isValid()) return false;
        const sibling = familyStore.createPerson({
          ...form.getValues(),
          relationship: RELATIONSHIP.AUNT_UNCLE,
          generation: GENERATION.PARENT,
        });
        // Link as sibling (works even before grandparents are added)
        familyStore.setSibling(parent.id, sibling.id);
        // Also share any existing grandparents
        const grandparents = familyStore.getParents(parent.id);
        for (const gp of grandparents) {
          familyStore.setParentChild(gp.id, sibling.id);
        }
        list.update(getSiblings());
      },
    });
  }

  function openEditModal(person, list, getSiblings) {
    const form = PersonForm({ name: person.name, sex: person.sex, xlhStatus: person.xlhStatus });
    Modal({
      title: 'Edit Aunt/Uncle',
      content: form,
      onSave: () => {
        if (!form.isValid()) return false;
        familyStore.updatePerson(person.id, form.getValues());
        list.update(getSiblings());
      },
    });
  }

  render();
  return container;
}
