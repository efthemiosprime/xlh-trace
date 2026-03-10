import { h } from '../../utils/dom.js';

/**
 * Replaces a trigger element (e.g. "+ Add" button) with a bare inline form.
 * No wrapper box or title — just the form fields + Save/Cancel.
 */
export function InlinePanel({ content, onSave, onCancel, saveLabel = 'Save', replaceTarget, container } = {}) {
  const actions = h('div', { className: 'inline-edit-actions' }, [
    h('button', { className: 'btn btn-secondary btn-sm', onClick: close }, 'Cancel'),
    h('button', { className: 'btn btn-primary btn-sm', onClick: save }, saveLabel),
  ]);

  const panel = h('div', { className: 'inline-edit-form' }, [
    content,
    actions,
  ]);

  function save() {
    if (onSave && onSave() === false) return;
    close();
  }

  function close() {
    panel.remove();
    if (replaceTarget) replaceTarget.style.display = '';
    if (onCancel) onCancel();
  }

  panel.close = close;

  if (replaceTarget && replaceTarget.parentNode) {
    replaceTarget.parentNode.insertBefore(panel, replaceTarget.nextSibling);
    replaceTarget.style.display = 'none';
  } else if (container) {
    container.appendChild(panel);
  }

  const firstInput = panel.querySelector('input');
  if (firstInput) firstInput.focus();

  return panel;
}
