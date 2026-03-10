import { h, clearElement } from '../utils/dom.js';
import { ProgressBar } from './ProgressBar.js';
import { WizardContainer } from './wizard/WizardContainer.js';
import { TreeRenderer } from './tree/TreeRenderer.js';
import { InheritanceEngine } from '../engine/InheritanceEngine.js';
import { familyStore } from '../data/FamilyStore.js';

export function App() {
  let currentStep = 1;
  let debounceTimer = null;

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

  // === Tree preview panel (left column) ===
  const previewEmpty = h('div', { className: 'tree-preview-empty' }, [
    h('p', {}, 'Add a family member to see the tree preview'),
  ]);
  const previewContent = h('div', { className: 'tree-preview-content' });
  const previewPanel = h('div', { className: 'tree-preview-panel' }, [
    previewContent,
    previewEmpty,
  ]);

  function refreshPreview() {
    if (currentStep === 6) return; // step 6 has its own full tree view
    clearElement(previewContent);
    const proband = familyStore.getProband();
    if (!proband) {
      previewEmpty.style.display = '';
      return;
    }
    previewEmpty.style.display = 'none';

    const engine = new InheritanceEngine(familyStore);
    engine.analyze();

    const renderer = TreeRenderer({ onNodeClick: null });
    const svg = renderer.render();
    previewContent.appendChild(svg);
  }

  function debouncedRefresh() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(refreshPreview, 200);
  }

  familyStore.subscribe(debouncedRefresh);
  refreshPreview();

  // === Wizard (right column) ===
  const wizard = WizardContainer({
    onStepChange: (step) => {
      currentStep = step;
      progressBar.update(step);
      // Hide preview on step 6 (it has its own tree), show otherwise
      if (step === 6) {
        previewPanel.classList.add('hidden');
        layout.classList.add('single-column');
      } else {
        previewPanel.classList.remove('hidden');
        layout.classList.remove('single-column');
        refreshPreview();
      }
    },
  });

  const wizardColumn = h('div', { className: 'wizard-column' }, [wizard]);
  const layout = h('div', { className: 'app-layout' }, [wizardColumn, previewPanel]);

  return h('div', { className: 'app' }, [header, progressBar, layout]);
}
