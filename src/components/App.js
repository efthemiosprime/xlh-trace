import { h } from '../utils/dom.js';
import { ProgressBar } from './ProgressBar.js';
import { WizardContainer } from './wizard/WizardContainer.js';
import { familyStore } from '../data/FamilyStore.js';

export function App() {
  const header = h('div', { className: 'app-header app-header--bar' }, [
    h('div', { className: 'app-header__actions' }, [
      h('a', {
        className: 'btn btn-ghost btn-sm',
        href: 'tree-builder.html',
      }, 'Tree Builder'),
      h('button', {
        className: 'btn btn-ghost btn-sm',
        onClick: () => {
          if (confirm('Clear all data and start over?')) {
            familyStore.clear();
            localStorage.removeItem('xlh-family-tree');
            location.reload();
          }
        },
      }, 'Reset'),
    ]),
    h('h1', {}, 'XLH Family Tree'),
    h('p', {}, 'Track X-linked hypophosphatemia inheritance patterns in your family'),
  ]);

  const progressBar = ProgressBar(1);

  const wizard = WizardContainer({
    onStepChange: (step) => progressBar.update(step),
  });

  return h('div', { className: 'app' }, [header, progressBar, wizard]);
}
