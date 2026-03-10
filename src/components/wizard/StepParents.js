import { h } from '../../utils/dom.js';
import { PersonForm } from '../shared/PersonForm.js';
import { PersonCard } from '../shared/PersonCard.js';
import { InlinePanel } from '../shared/InlinePanel.js';
import { familyStore } from '../../data/FamilyStore.js';
import { RELATIONSHIP, GENERATION, SEX, XLH_STATUS } from '../../data/constants.js';

export function StepParents() {
  const proband = familyStore.getProband();
  const spouse = proband.spouseId ? familyStore.getPerson(proband.spouseId) : null;
  const container = h('div');
  let activeTab = 'proband';
  let activePanel = null;

  function closeActivePanel() {
    if (activePanel) { activePanel.close(); activePanel = null; }
  }

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
    activePanel = null;
    const target = getTarget();
    const mother = getMother();
    const father = getFather();

    container.append(
      h('h2', {}, 'Add Parents'),
      h('p', { className: 'step-description' }, `Add ${target.name}'s mother and/or father.`),
    );

    if (spouse) {
      container.appendChild(renderTabs());
    }

    // Mother section
    container.appendChild(h('h3', { style: 'margin: 1rem 0 0.5rem' }, 'Mother'));
    if (mother) {
      container.appendChild(PersonCard(mother, {
        onSave: (person, values) => {
          familyStore.updatePerson(person.id, values);
          render();
        },
        onRemove: () => { familyStore.removePerson(mother.id); render(); },
        sexLocked: true,
      }));
    } else {
      container.appendChild(
        h('button', { className: 'add-person-btn', onClick: (e) => openAddPanel(SEX.FEMALE, 'Mother', e.currentTarget) }, '+ Add Mother')
      );
    }

    // Father section
    container.appendChild(h('h3', { style: 'margin: 1rem 0 0.5rem' }, 'Father'));
    if (father) {
      container.appendChild(PersonCard(father, {
        onSave: (person, values) => {
          familyStore.updatePerson(person.id, values);
          render();
        },
        onRemove: () => { familyStore.removePerson(father.id); render(); },
        sexLocked: true,
      }));
    } else {
      container.appendChild(
        h('button', { className: 'add-person-btn', onClick: (e) => openAddPanel(SEX.MALE, 'Father', e.currentTarget) }, '+ Add Father')
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

  function openAddPanel(sex, _label, triggerBtn) {
    closeActivePanel();
    const target = getTarget();
    const form = PersonForm({ sex, sexLocked: true, xlhStatus: XLH_STATUS.UNKNOWN });
    activePanel = InlinePanel({
      content: form,
      replaceTarget: triggerBtn,
      onSave: () => {
        if (!form.isValid()) return false;
        const parent = familyStore.createPerson({
          ...form.getValues(),
          relationship: RELATIONSHIP.PARENT,
          generation: GENERATION.PARENT,
        });
        familyStore.setParentChild(parent.id, target.id);

        const otherParent = sex === SEX.FEMALE ? getFather() : getMother();
        if (otherParent) {
          familyStore.setSpouse(parent.id, otherParent.id);
        }

        render();
      },
      onCancel: () => { activePanel = null; },
    });
  }

  render();
  return container;
}
