import { h } from '../../utils/dom.js';

export function PersonCard(person, { onEdit, onRemove } = {}) {
  const icon = h('div', {
    className: `person-icon ${person.sex} ${person.xlhStatus}`,
  }, person.name.charAt(0).toUpperCase());

  const info = h('div', { className: 'person-info' }, [
    h('div', { className: 'person-name' }, person.name),
    h('div', { className: 'person-meta' }, `${capitalize(person.sex)} - ${formatStatus(person.xlhStatus)}`),
  ]);

  const actions = h('div', { className: 'person-actions' });

  if (onEdit) {
    const editBtn = h('button', { className: 'btn btn-sm btn-secondary', onClick: () => onEdit(person) }, 'Edit');
    actions.appendChild(editBtn);
  }

  if (onRemove) {
    const removeBtn = h('button', { className: 'btn btn-sm btn-ghost', onClick: () => onRemove(person) }, '\u00D7');
    actions.appendChild(removeBtn);
  }

  return h('div', { className: 'person-card', dataset: { personId: person.id } }, [icon, info, actions]);
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function formatStatus(status) {
  if (status === 'affected') return 'Affected (XLH)';
  if (status === 'unaffected') return 'Unaffected';
  return 'Unknown';
}
