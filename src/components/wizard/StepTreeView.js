import { h, clearElement } from '../../utils/dom.js';
import { familyStore } from '../../data/FamilyStore.js';
import { InheritanceEngine } from '../../engine/InheritanceEngine.js';
import { TreeAnalyzer } from '../../engine/TreeAnalyzer.js';
import { TreeRenderer } from '../tree/TreeRenderer.js';
import { TreeLegend } from '../tree/TreeLegend.js';
import { PersonForm } from '../shared/PersonForm.js';
import { Modal } from '../shared/Modal.js';
import { exportTreePDF } from '../../utils/pdfExport.js';
import { shareTreePDF } from '../../utils/shareExport.js';
import { relationshipLabel } from '../../data/constants.js';

export function StepTreeView({ onPrev }) {
  const container = h('div');

  function render() {
    clearElement(container);

    // Run inheritance analysis
    const engine = new InheritanceEngine(familyStore);
    engine.analyze();

    const analyzer = new TreeAnalyzer(familyStore);
    const report = analyzer.generateReport();

    container.append(
      h('h2', {}, 'Your XLH Family Tree'),
      h('p', { className: 'step-description' }, 'Click on any family member to edit. The inheritance analysis runs automatically.'),
    );

    // Tree visualization
    const treeContainer = h('div', { className: 'tree-container' });
    const renderer = TreeRenderer({
      onNodeClick: (person) => openEditModal(person),
    });
    const svg = renderer.render();
    treeContainer.appendChild(svg);
    container.appendChild(treeContainer);

    // Export / Share buttons
    container.appendChild(h('div', { style: 'text-align: center; margin-top: 0.75rem; display: flex; justify-content: center; gap: 0.5rem;' }, [
      h('button', {
        className: 'btn btn-secondary btn-sm no-print',
        onClick: () => exportTreePDF(svg),
      }, 'Export PDF'),
      h('button', {
        className: 'btn btn-secondary btn-sm no-print',
        onClick: () => shareTreePDF(svg),
      }, 'Share'),
    ]));

    // Legend
    container.appendChild(TreeLegend());

    // Analysis panel
    const analysisPanel = h('div', { className: 'analysis-panel' }, [
      h('h3', {}, 'Inheritance Analysis'),
      ...report.summary.map(line => h('div', { className: 'analysis-item' }, line)),
    ]);

    if (report.affected.length > 0) {
      const affectedSection = h('div', { style: 'margin-top: 0.75rem' }, [
        h('strong', { style: 'font-size: 0.85rem' }, 'Affected Members:'),
        ...report.affected.map(p =>
          h('div', { className: 'analysis-item' }, [
            h('span', { className: 'analysis-tag', style: 'background: var(--color-affected)' }, p.xlhStatus),
            ` ${p.name}`,
            p.isSpontaneous ? h('span', { className: 'analysis-tag', style: 'background: var(--color-spontaneous); margin-left: 0.5rem' }, 'spontaneous') : '',
          ])
        ),
      ]);
      analysisPanel.appendChild(affectedSection);
    }

    if (report.carriers.length > 0) {
      const carrierSection = h('div', { style: 'margin-top: 0.75rem' }, [
        h('strong', { style: 'font-size: 0.85rem' }, 'Identified Carriers:'),
        ...report.carriers.map(p => {
          const color = p.computedStatus === 'carrier_probable' ? 'var(--color-carrier-probable)' : 'var(--color-carrier-possible)';
          return h('div', { className: 'analysis-item' }, [
            h('span', { className: 'analysis-tag', style: `background: ${color}` }, p.computedStatus.replace('_', ' ')),
            ` ${p.name}`,
            p.probability !== null ? ` (${Math.round(p.probability * 100)}% probability)` : '',
          ]);
        }),
      ]);
      analysisPanel.appendChild(carrierSection);
    }

    container.appendChild(analysisPanel);

    // Nav
    container.appendChild(h('div', { className: 'wizard-nav' }, [
      h('button', { className: 'btn btn-secondary', onClick: onPrev }, '\u2190 Back to Edit'),
      h('button', { className: 'btn btn-danger btn-sm', onClick: () => {
        if (confirm('Reset the entire family tree? This cannot be undone.')) {
          familyStore.clear();
          location.reload();
        }
      }}, 'Start Over'),
    ]));
  }

  function openEditModal(person) {
    const form = PersonForm({
      name: person.name,
      sex: person.sex,
      xlhStatus: person.xlhStatus,
      sexLocked: true,
    });
    Modal({
      title: `Edit ${person.name} (${relationshipLabel(person)})`,
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
