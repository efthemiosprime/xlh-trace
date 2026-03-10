import { h } from '../../utils/dom.js';
import { PersonForm } from '../shared/PersonForm.js';
import { PersonCard } from '../shared/PersonCard.js';
import { PersonList } from '../shared/PersonList.js';
import { InlinePanel } from '../shared/InlinePanel.js';
import { familyStore } from '../../data/FamilyStore.js';
import { RELATIONSHIP, GENERATION, SEX, XLH_STATUS } from '../../data/constants.js';

export function StepChildren() {
  const proband = familyStore.getProband();
  const getChildren = () => familyStore.getChildren(proband.id);
  const getSpouse = () => proband.spouseId ? familyStore.getPerson(proband.spouseId) : null;

  const container = h('div');
  let activePanel = null;

  function closeActivePanel() {
    if (activePanel) { activePanel.close(); activePanel = null; }
  }

  function render() {
    container.innerHTML = '';
    activePanel = null;

    container.append(
      h('h2', {}, 'Family'),
      h('p', { className: 'step-description' }, `Add ${proband.name}'s spouse and children. Skip if none.`),
    );

    // --- Spouse section ---
    container.appendChild(h('h3', { style: 'margin: 1rem 0 0.5rem' }, 'Spouse / Partner (optional)'));
    const spouse = getSpouse();

    if (spouse) {
      container.appendChild(PersonCard(spouse, {
        onSave: (person, values) => {
          familyStore.updatePerson(person.id, values);
          render();
        },
        onRemove: () => {
          const children = getChildren();
          for (const child of children) {
            child.parentIds = child.parentIds.filter(id => id !== spouse.id);
          }
          familyStore.removePerson(spouse.id);
          render();
        },
        sexLocked: true,
      }));
    } else {
      const oppositeSex = proband.sex === SEX.MALE ? SEX.FEMALE : SEX.MALE;
      container.appendChild(
        h('button', {
          className: 'add-person-btn',
          onClick: (e) => openSpouseAdd(oppositeSex, e.currentTarget),
        }, '+ Add Spouse')
      );
    }

    // --- Children section ---
    container.appendChild(h('h3', { style: 'margin: 1.25rem 0 0.5rem' }, 'Children'));

    const list = PersonList({
      people: getChildren(),
      emptyText: 'No children added yet.',
      addLabel: '+ Add Child',
      onAdd: null, // handled manually below
      onEdit: null, // handled via PersonCard onSave
      onRemove: (person) => {
        familyStore.removePerson(person.id);
        render();
      },
      onSave: (person, values) => {
        familyStore.updatePerson(person.id, values);
        render();
      },
    });

    container.appendChild(list);

    // Add child button
    const addBtn = h('button', {
      className: 'add-person-btn',
      onClick: (e) => openAddChild(e.currentTarget),
    }, '+ Add Child');
    container.appendChild(addBtn);
  }

  function openSpouseAdd(sex, triggerBtn) {
    closeActivePanel();
    const form = PersonForm({ sex, sexLocked: true, xlhStatus: XLH_STATUS.UNKNOWN });
    activePanel = InlinePanel({
      content: form,
      replaceTarget: triggerBtn,
      onSave: () => {
        if (!form.isValid()) return false;
        const spouse = familyStore.createPerson({
          ...form.getValues(),
          relationship: RELATIONSHIP.SPOUSE,
          generation: GENERATION.PROBAND,
        });
        familyStore.setSpouse(proband.id, spouse.id);
        const children = getChildren();
        for (const child of children) {
          familyStore.setParentChild(spouse.id, child.id);
        }
        render();
      },
      onCancel: () => { activePanel = null; },
    });
  }

  function openAddChild(triggerBtn) {
    closeActivePanel();
    const form = PersonForm();
    activePanel = InlinePanel({
      content: form,
      replaceTarget: triggerBtn,
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
      onCancel: () => { activePanel = null; },
    });
  }

  render();
  return container;
}
