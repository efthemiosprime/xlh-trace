import { h } from '../utils/dom.js';
import { ProgressBar } from './ProgressBar.js';
import { WizardContainer } from './wizard/WizardContainer.js';
import { familyStore } from '../data/FamilyStore.js';

export function App() {
  const resetBtn = h('button', {
    className: 'btn btn-ghost btn-sm',
    style: 'position: absolute; top: 1rem; right: 1rem;',
    onClick: () => {
      if (confirm('Clear all data and start over?')) {
        familyStore.clear();
        localStorage.removeItem('xlh-family-tree');
        location.reload();
      }
    },
  }, 'Reset');

  const header = h('div', { className: 'app-header', style: 'position: relative;' }, [
    h('h1', {}, 'XLH Family Tree'),
    h('p', {}, 'Track X-linked hypophosphatemia inheritance patterns in your family'),
    resetBtn,
  ]);

  const progressBar = ProgressBar(1);

  const wizard = WizardContainer({
    onStepChange: (step) => progressBar.update(step),
  });

  return h('div', { className: 'app' }, [header, progressBar, wizard]);
}
