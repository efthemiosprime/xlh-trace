import { h } from '../../utils/dom.js';
import { PersonForm } from '../shared/PersonForm.js';
import { PersonCard } from '../shared/PersonCard.js';
import { InlinePanel } from '../shared/InlinePanel.js';
import { familyStore } from '../../data/FamilyStore.js';
import { RELATIONSHIP, GENERATION, SEX, XLH_STATUS } from '../../data/constants.js';

export function StepGrandparents() {
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
      h('h2', {}, 'Add Grandparents'),
      h('p', { className: 'step-description' }, `Add parents of ${target.name}'s parents. Skip if unknown.`),
    );

    if (spouse) {
      container.appendChild(renderTabs());
    }

    if (parents.length === 0) {
      container.appendChild(h('p', { style: 'color: var(--color-text-muted)' }, `Add ${target.name}'s parents first (go back to the Parents step).`));
      return;
    }

    for (const parent of parents) {
      const side = parent.sex === SEX.FEMALE ? 'Maternal' : 'Paternal';
      container.appendChild(h('h3', { style: 'margin: 1.25rem 0 0.5rem' }, `${side} Grandparents (parents of ${parent.name})`));

      const gpParents = familyStore.getParents(parent.id);
      const gm = gpParents.find(p => p.sex === SEX.FEMALE);
      const gf = gpParents.find(p => p.sex === SEX.MALE);

      // Grandmother
      container.appendChild(h('div', { style: 'margin-left: 0.5rem' }, [
        h('strong', { style: 'font-size: 0.85rem' }, `${side} Grandmother`),
      ]));
      if (gm) {
        container.appendChild(PersonCard(gm, {
          onSave: (person, values) => {
            familyStore.updatePerson(person.id, values);
            render();
          },
          onRemove: () => { familyStore.removePerson(gm.id); render(); },
          sexLocked: true,
        }));
      } else {
        container.appendChild(
          h('button', { className: 'add-person-btn', style: 'margin-bottom: 0.75rem', onClick: (e) => openAddPanel(parent, SEX.FEMALE, `${side} Grandmother`, e.currentTarget) }, `+ Add ${side} Grandmother`)
        );
      }

      // Grandfather
      container.appendChild(h('div', { style: 'margin-left: 0.5rem' }, [
        h('strong', { style: 'font-size: 0.85rem' }, `${side} Grandfather`),
      ]));
      if (gf) {
        container.appendChild(PersonCard(gf, {
          onSave: (person, values) => {
            familyStore.updatePerson(person.id, values);
            render();
          },
          onRemove: () => { familyStore.removePerson(gf.id); render(); },
          sexLocked: true,
        }));
      } else {
        container.appendChild(
          h('button', { className: 'add-person-btn', style: 'margin-bottom: 0.75rem', onClick: (e) => openAddPanel(parent, SEX.MALE, `${side} Grandfather`, e.currentTarget) }, `+ Add ${side} Grandfather`)
        );
      }
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

  function openAddPanel(parentNode, sex, _label, triggerBtn) {
    closeActivePanel();
    const form = PersonForm({ sex, sexLocked: true, xlhStatus: XLH_STATUS.UNKNOWN });
    activePanel = InlinePanel({
      content: form,
      replaceTarget: triggerBtn,
      onSave: () => {
        if (!form.isValid()) return false;
        const gp = familyStore.createPerson({
          ...form.getValues(),
          relationship: RELATIONSHIP.GRANDPARENT,
          generation: GENERATION.GRANDPARENT,
        });
        familyStore.setParentChild(gp.id, parentNode.id);

        const otherGP = familyStore.getParents(parentNode.id).find(p => p.id !== gp.id);
        if (otherGP) {
          familyStore.setSpouse(gp.id, otherGP.id);
        }

        const siblings = familyStore.getSiblings(parentNode.id);
        for (const sib of siblings) {
          familyStore.setParentChild(gp.id, sib.id);
        }

        render();
      },
      onCancel: () => { activePanel = null; },
    });
  }

  render();
  return container;
}
