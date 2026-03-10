import { h, clearElement } from '../../utils/dom.js';
import { PersonForm } from './PersonForm.js';

export function PersonCard(person, { onEdit, onRemove, onSave, sexLocked = true } = {}) {
  const card = h('div', { className: 'person-card', dataset: { personId: person.id } });
  let editing = false;

  function renderDisplay() {
    clearElement(card);
    card.className = 'person-card';
    editing = false;

    const icon = h('div', {
      className: `person-icon ${person.sex} ${person.xlhStatus}`,
    }, person.name.charAt(0).toUpperCase());

    const info = h('div', { className: 'person-info' }, [
      h('div', { className: 'person-name' }, person.name),
      h('div', { className: 'person-meta' }, `${capitalize(person.sex)} - ${formatStatus(person.xlhStatus)}`),
    ]);

    const actions = h('div', { className: 'person-actions' });

    if (onSave) {
      // Inline-editable mode
      const editBtn = h('button', { className: 'btn btn-sm btn-secondary', onClick: () => renderEditForm() }, 'Edit');
      actions.appendChild(editBtn);
    } else if (onEdit) {
      const editBtn = h('button', { className: 'btn btn-sm btn-secondary', onClick: () => onEdit(person) }, 'Edit');
      actions.appendChild(editBtn);
    }

    if (onRemove) {
      const removeBtn = h('button', { className: 'btn btn-sm btn-ghost', onClick: () => onRemove(person) }, '\u00D7');
      actions.appendChild(removeBtn);
    }

    card.append(icon, info, actions);
  }

  function renderEditForm() {
    clearElement(card);
    card.className = 'person-card person-card--editing';
    editing = true;

    const form = PersonForm({
      name: person.name,
      sex: person.sex,
      xlhStatus: person.xlhStatus,
      sexLocked,
    });

    const actions = h('div', { className: 'inline-edit-actions' }, [
      h('button', { className: 'btn btn-secondary btn-sm', onClick: () => renderDisplay() }, 'Cancel'),
      h('button', { className: 'btn btn-primary btn-sm', onClick: () => {
        if (!form.isValid()) return;
        onSave(person, form.getValues());
        renderDisplay();
      }}, 'Save'),
    ]);

    card.append(form, actions);
  }

  renderDisplay();
  card.isEditing = () => editing;
  return card;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function formatStatus(status) {
  if (status === 'affected') return 'Affected (XLH)';
  if (status === 'unaffected') return 'Unaffected';
  return 'Unknown';
}
