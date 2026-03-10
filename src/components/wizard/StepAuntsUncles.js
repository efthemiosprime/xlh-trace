import { h } from '../../utils/dom.js';
import { PersonForm } from '../shared/PersonForm.js';
import { PersonList } from '../shared/PersonList.js';
import { InlinePanel } from '../shared/InlinePanel.js';
import { familyStore } from '../../data/FamilyStore.js';
import { RELATIONSHIP, GENERATION, SEX } from '../../data/constants.js';

export function StepAuntsUncles() {
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

  function render() {
    container.innerHTML = '';
    activePanel = null;
    const target = getTarget();
    const parents = familyStore.getParents(target.id);

    container.append(
      h('h2', {}, 'Add Aunts & Uncles'),
      h('p', { className: 'step-description' }, `Add siblings of ${target.name}'s parents. Skip if none.`),
    );

    if (spouse) {
      container.appendChild(renderTabs());
    }

    if (parents.length === 0) {
      container.appendChild(h('p', { style: 'color: var(--color-text-muted)' }, `Add ${target.name}'s parents first (go back to the Parents step).`));
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
        onAdd: null,
        onSave: (person, values) => {
          familyStore.updatePerson(person.id, values);
          list.update(siblingsOfParent());
        },
        onRemove: (person) => {
          familyStore.removePerson(person.id);
          list.update(siblingsOfParent());
        },
      });

      container.appendChild(list);

      // Add button
      const addBtn = h('button', {
        className: 'add-person-btn',
        onClick: (e) => openAddPanel(parent, list, siblingsOfParent, e.currentTarget),
      }, `+ Add ${label} sibling`);
      container.appendChild(addBtn);
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

  function openAddPanel(parent, list, getSiblings, triggerBtn) {
    closeActivePanel();
    const form = PersonForm();
    activePanel = InlinePanel({
      content: form,
      replaceTarget: triggerBtn,
      onSave: () => {
        if (!form.isValid()) return false;
        const sibling = familyStore.createPerson({
          ...form.getValues(),
          relationship: RELATIONSHIP.AUNT_UNCLE,
          generation: GENERATION.PARENT,
        });
        familyStore.setSibling(parent.id, sibling.id);
        const grandparents = familyStore.getParents(parent.id);
        for (const gp of grandparents) {
          familyStore.setParentChild(gp.id, sibling.id);
        }
        list.update(getSiblings());
      },
      onCancel: () => { activePanel = null; },
    });
  }

  render();
  return container;
}
