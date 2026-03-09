import { h } from '../../utils/dom.js';
import { PersonForm } from '../shared/PersonForm.js';
import { PersonCard } from '../shared/PersonCard.js';
import { Modal } from '../shared/Modal.js';
import { familyStore } from '../../data/FamilyStore.js';
import { RELATIONSHIP, GENERATION, SEX, XLH_STATUS } from '../../data/constants.js';

export function StepParents() {
  const proband = familyStore.getProband();
  const spouse = proband.spouseId ? familyStore.getPerson(proband.spouseId) : null;
  const container = h('div');
  let activeTab = 'proband';

  function getTarget() {
    return activeTab === 'spouse' ? spouse : proband;
  }

  function getParents() {
    return familyStore.getParents(getTarget().id);
  }

  function getMother() {
    return getParents().find(p => p.sex === SEX.FEMALE);
  }

  function getFather() {
    return getParents().find(p => p.sex === SEX.MALE);
  }

  function render() {
    container.innerHTML = '';
    const target = getTarget();
    const mother = getMother();
    const father = getFather();

    container.append(
      h('h2', {}, 'Add Parents'),
      h('p', { className: 'step-description' }, `Add ${target.name}'s mother and/or father.`),
    );

    // Tabs (only if spouse exists)
    if (spouse) {
      container.appendChild(renderTabs());
    }

    // Mother section
    container.appendChild(h('h3', { style: 'margin: 1rem 0 0.5rem' }, 'Mother'));
    if (mother) {
      container.appendChild(PersonCard(mother, {
        onEdit: () => openEditModal(mother),
        onRemove: () => { familyStore.removePerson(mother.id); render(); },
      }));
    } else {
      container.appendChild(
        h('button', { className: 'add-person-btn', onClick: () => openAddModal(SEX.FEMALE, 'Mother') }, '+ Add Mother')
      );
    }

    // Father section
    container.appendChild(h('h3', { style: 'margin: 1rem 0 0.5rem' }, 'Father'));
    if (father) {
      container.appendChild(PersonCard(father, {
        onEdit: () => openEditModal(father),
        onRemove: () => { familyStore.removePerson(father.id); render(); },
      }));
    } else {
      container.appendChild(
        h('button', { className: 'add-person-btn', onClick: () => openAddModal(SEX.MALE, 'Father') }, '+ Add Father')
      );
    }
  }

  function renderTabs() {
    const probandTab = h('button', {
      className: `side-tab${activeTab === 'proband' ? ' active' : ''}`,
      onClick: () => { activeTab = 'proband'; render(); },
    }, `${proband.name}'s Side`);

    const spouseTab = h('button', {
      className: `side-tab${activeTab === 'spouse' ? ' active' : ''}`,
      onClick: () => { activeTab = 'spouse'; render(); },
    }, `${spouse.name}'s Side`);

    return h('div', { className: 'side-tabs' }, [probandTab, spouseTab]);
  }

  function openAddModal(sex, label) {
    const target = getTarget();
    const form = PersonForm({ sex, sexLocked: true, xlhStatus: XLH_STATUS.UNKNOWN });
    Modal({
      title: `Add ${label}`,
      content: form,
      onSave: () => {
        if (!form.isValid()) return false;
        const parent = familyStore.createPerson({
          ...form.getValues(),
          relationship: RELATIONSHIP.PARENT,
          generation: GENERATION.PARENT,
        });
        familyStore.setParentChild(parent.id, target.id);

        // Set parents as spouses of each other
        const otherParent = sex === SEX.FEMALE ? getFather() : getMother();
        if (otherParent) {
          familyStore.setSpouse(parent.id, otherParent.id);
        }

        render();
      },
    });
  }

  function openEditModal(person) {
    const form = PersonForm({ name: person.name, sex: person.sex, xlhStatus: person.xlhStatus, sexLocked: true });
    Modal({
      title: 'Edit Parent',
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
