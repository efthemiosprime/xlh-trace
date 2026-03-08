import { h } from '../../utils/dom.js';

export function Modal({ title, content, onSave, onCancel, saveLabel = 'Save' }) {
  const overlay = h('div', { className: 'modal-overlay' });

  const modal = h('div', { className: 'modal' }, [
    h('h3', {}, title),
    content,
    h('div', { className: 'modal-actions' }, [
      h('button', { className: 'btn btn-secondary', onClick: () => close() }, 'Cancel'),
      h('button', { className: 'btn btn-primary', onClick: () => { if (onSave && onSave() === false) return; close(); } }, saveLabel),
    ]),
  ]);

  overlay.appendChild(modal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  function close() {
    overlay.remove();
    if (onCancel) onCancel();
  }

  overlay.close = close;

  document.body.appendChild(overlay);
  const firstInput = modal.querySelector('input');
  if (firstInput) firstInput.focus();

  return overlay;
}
