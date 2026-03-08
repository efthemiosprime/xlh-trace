import { h } from '../../utils/dom.js';
import { PersonForm } from '../shared/PersonForm.js';
import { PersonCard } from '../shared/PersonCard.js';
import { Modal } from '../shared/Modal.js';
import { familyStore } from '../../data/FamilyStore.js';
import { RELATIONSHIP, GENERATION, SEX, XLH_STATUS } from '../../data/constants.js';

export function StepGrandparents() {
  const proband = familyStore.getProband();
  const parents = familyStore.getParents(proband.id);
  const container = h('div');

  function render() {
    container.innerHTML = '';
    container.append(
      h('h2', {}, 'Add Grandparents'),
      h('p', { className: 'step-description' }, 'Add parents of each of your parents. Skip if unknown.'),
    );

    if (parents.length === 0) {
      container.appendChild(h('p', { style: 'color: var(--color-text-muted)' }, 'Add parents first (go back to step 3).'));
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
          onEdit: () => openEditModal(gm),
          onRemove: () => { familyStore.removePerson(gm.id); render(); },
        }));
      } else {
        container.appendChild(
          h('button', { className: 'add-person-btn', style: 'margin-bottom: 0.75rem', onClick: () => openAddModal(parent, SEX.FEMALE, `${side} Grandmother`) }, `+ Add ${side} Grandmother`)
        );
      }

      // Grandfather
      container.appendChild(h('div', { style: 'margin-left: 0.5rem' }, [
        h('strong', { style: 'font-size: 0.85rem' }, `${side} Grandfather`),
      ]));
      if (gf) {
        container.appendChild(PersonCard(gf, {
          onEdit: () => openEditModal(gf),
          onRemove: () => { familyStore.removePerson(gf.id); render(); },
        }));
      } else {
        container.appendChild(
          h('button', { className: 'add-person-btn', style: 'margin-bottom: 0.75rem', onClick: () => openAddModal(parent, SEX.MALE, `${side} Grandfather`) }, `+ Add ${side} Grandfather`)
        );
      }
    }
  }

  function openAddModal(parentNode, sex, label) {
    const form = PersonForm({ sex, sexLocked: true, xlhStatus: XLH_STATUS.UNKNOWN });
    Modal({
      title: `Add ${label}`,
      content: form,
      onSave: () => {
        if (!form.isValid()) return false;
        const gp = familyStore.createPerson({
          ...form.getValues(),
          relationship: RELATIONSHIP.GRANDPARENT,
          generation: GENERATION.GRANDPARENT,
        });
        familyStore.setParentChild(gp.id, parentNode.id);

        // Set grandparents as spouses if both exist
        const otherGP = familyStore.getParents(parentNode.id).find(p => p.id !== gp.id);
        if (otherGP) {
          familyStore.setSpouse(gp.id, otherGP.id);
        }

        // Also set as parent of aunts/uncles (siblings of this parent)
        const siblings = familyStore.getSiblings(parentNode.id);
        for (const sib of siblings) {
          familyStore.setParentChild(gp.id, sib.id);
        }

        render();
      },
    });
  }

  function openEditModal(person) {
    const form = PersonForm({ name: person.name, sex: person.sex, xlhStatus: person.xlhStatus, sexLocked: true });
    Modal({
      title: 'Edit Grandparent',
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
