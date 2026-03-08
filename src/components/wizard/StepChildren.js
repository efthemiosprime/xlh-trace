import { h } from '../../utils/dom.js';
import { PersonForm } from '../shared/PersonForm.js';
import { PersonCard } from '../shared/PersonCard.js';
import { PersonList } from '../shared/PersonList.js';
import { Modal } from '../shared/Modal.js';
import { familyStore } from '../../data/FamilyStore.js';
import { RELATIONSHIP, GENERATION, SEX, XLH_STATUS } from '../../data/constants.js';

export function StepChildren() {
  const proband = familyStore.getProband();
  const getChildren = () => familyStore.getChildren(proband.id);
  const getSpouse = () => proband.spouseId ? familyStore.getPerson(proband.spouseId) : null;

  const container = h('div');

  function render() {
    container.innerHTML = '';

    container.append(
      h('h2', {}, 'Family'),
      h('p', { className: 'step-description' }, `Add ${proband.name}'s spouse and children. Skip if none.`),
    );

    // --- Spouse section ---
    container.appendChild(h('h3', { style: 'margin: 1rem 0 0.5rem' }, 'Spouse / Partner (optional)'));
    const spouse = getSpouse();

    if (spouse) {
      container.appendChild(PersonCard(spouse, {
        onEdit: () => openSpouseEditModal(spouse),
        onRemove: () => {
          // Unlink children from spouse
          const children = getChildren();
          for (const child of children) {
            child.parentIds = child.parentIds.filter(id => id !== spouse.id);
          }
          familyStore.removePerson(spouse.id);
          render();
        },
      }));
    } else {
      const oppositeSex = proband.sex === SEX.MALE ? SEX.FEMALE : SEX.MALE;
      container.appendChild(
        h('button', {
          className: 'add-person-btn',
          onClick: () => openSpouseAddModal(oppositeSex),
        }, '+ Add Spouse')
      );
    }

    // --- Children section ---
    container.appendChild(h('h3', { style: 'margin: 1.25rem 0 0.5rem' }, 'Children'));

    const list = PersonList({
      people: getChildren(),
      emptyText: 'No children added yet.',
      addLabel: '+ Add Child',
      onAdd: () => openAddChildModal(),
      onEdit: (person) => openEditChildModal(person),
      onRemove: (person) => {
        familyStore.removePerson(person.id);
        render();
      },
    });

    container.appendChild(list);
  }

  function openSpouseAddModal(sex) {
    const form = PersonForm({ sex, sexLocked: true, xlhStatus: XLH_STATUS.UNKNOWN });
    Modal({
      title: 'Add Spouse',
      content: form,
      onSave: () => {
        if (!form.isValid()) return false;
        const spouse = familyStore.createPerson({
          ...form.getValues(),
          relationship: RELATIONSHIP.SPOUSE,
          generation: GENERATION.PROBAND,
        });
        familyStore.setSpouse(proband.id, spouse.id);
        // Link existing children to spouse
        const children = getChildren();
        for (const child of children) {
          familyStore.setParentChild(spouse.id, child.id);
        }
        render();
      },
    });
  }

  function openSpouseEditModal(spouse) {
    const form = PersonForm({ name: spouse.name, sex: spouse.sex, xlhStatus: spouse.xlhStatus, sexLocked: true });
    Modal({
      title: 'Edit Spouse',
      content: form,
      onSave: () => {
        if (!form.isValid()) return false;
        familyStore.updatePerson(spouse.id, form.getValues());
        render();
      },
    });
  }

  function openAddChildModal() {
    const form = PersonForm();
    Modal({
      title: 'Add Child',
      content: form,
      onSave: () => {
        if (!form.isValid()) return false;
        const child = familyStore.createPerson({
          ...form.getValues(),
          relationship: RELATIONSHIP.CHILD,
          generation: GENERATION.CHILD,
        });
        familyStore.setParentChild(proband.id, child.id);
        const spouse = getSpouse();
        if (spouse) {
          familyStore.setParentChild(spouse.id, child.id);
        }
        render();
      },
    });
  }

  function openEditChildModal(person) {
    const form = PersonForm({ name: person.name, sex: person.sex, xlhStatus: person.xlhStatus });
    Modal({
      title: 'Edit Child',
      content: form,
      onSave: () => {
        if (!form.isValid()) return false;
        familyStore.updatePerson(person.id, form.getValues());
        render();
      },
    });
  }

  render();
  return container;
}
