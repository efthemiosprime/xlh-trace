import { h, clearElement } from '../../utils/dom.js';
import { familyStore } from '../../data/FamilyStore.js';
import { InheritanceEngine } from '../../engine/InheritanceEngine.js';
import { TreeAnalyzer } from '../../engine/TreeAnalyzer.js';
import { TreeRenderer } from '../tree/TreeRenderer.js';
import { TreeActionButtons } from './TreeActionButtons.js';
import { TreeLegend } from '../tree/TreeLegend.js';
import { PersonForm } from '../shared/PersonForm.js';
import { Modal } from '../shared/Modal.js';
import { SEX, RELATIONSHIP, GENERATION, relationshipLabel } from '../../data/constants.js';
import { exportTreePDF } from '../../utils/pdfExport.js';
import { shareTreePDF } from '../../utils/shareExport.js';

export function TreeBuilderApp() {
  const root = h('div', { className: 'tree-builder' });

  // Context menu element
  const contextMenu = h('div', { className: 'context-menu' });
  contextMenu.style.display = 'none';
  document.body.appendChild(contextMenu);

  // Dismiss context menu
  document.addEventListener('click', () => hideContextMenu());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideContextMenu();
  });

  function hideContextMenu() {
    contextMenu.style.display = 'none';
  }

  function render() {
    clearElement(root);

    const header = h('div', { className: 'app-header app-header--bar' }, [
      h('div', { className: 'app-header__actions' }, [
        h('a', {
          className: 'btn btn-ghost btn-sm',
          href: 'index.html',
        }, 'Wizard Mode'),
        h('button', {
          className: 'btn btn-secondary btn-sm no-print',
          onClick: () => {
            const svgEl = root.querySelector('.tree-svg');
            if (svgEl) exportTreePDF(svgEl);
          },
        }, 'Export PDF'),
        h('button', {
          className: 'btn btn-secondary btn-sm no-print',
          onClick: () => {
            const svgEl = root.querySelector('.tree-svg');
            if (svgEl) shareTreePDF(svgEl);
          },
        }, 'Share'),
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
      h('h1', {}, 'XLH Family Tree Builder'),
      h('p', {}, 'Build your family tree visually — click + buttons to add members'),
    ]);
    root.appendChild(header);

    const proband = familyStore.getProband();

    if (!proband) {
      // Empty state
      const emptyState = h('div', { className: 'tree-empty-state' }, [
        h('h2', {}, 'Start Your Family Tree'),
        h('p', {}, 'Add the first family member to begin building your tree.'),
        h('button', {
          className: 'btn btn-primary',
          style: 'margin-top: 1rem;',
          onClick: () => openAddProbandModal(),
        }, '+ Add First Member'),
      ]);
      root.appendChild(emptyState);
      return;
    }

    // Run inheritance analysis
    const engine = new InheritanceEngine(familyStore);
    engine.analyze();

    // Tree visualization
    const treeContainer = h('div', { className: 'tree-container' });
    const renderer = TreeRenderer({
      onNodeClick: (person) => openEditModal(person),
    });
    const svg = renderer.render();

    // Add action buttons overlay (hidden by default, shown on hover)
    const positions = renderer.getPositions();
    const actionButtons = TreeActionButtons({ positions });
    svg.appendChild(actionButtons);

    // Show/hide action buttons on hover with a delay so they don't vanish
    let activeGroup = null;
    let hideTimer = null;

    function showGroupFor(personId) {
      clearTimeout(hideTimer);
      if (activeGroup) activeGroup.classList.remove('visible');
      activeGroup = svg.querySelector(`.action-group[data-for-person="${personId}"]`);
      if (activeGroup) activeGroup.classList.add('visible');
    }

    function scheduleHide() {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (activeGroup) {
          activeGroup.classList.remove('visible');
          activeGroup = null;
        }
      }, 300);
    }

    function cancelHide() {
      clearTimeout(hideTimer);
    }

    svg.addEventListener('mouseover', (e) => {
      // Hovering over a tree node — show its buttons
      const node = e.target.closest('.tree-node');
      if (node) {
        const personId = node.dataset.personId;
        if (personId) showGroupFor(personId);
        return;
      }
      // Hovering over an action button — keep it visible
      const actionGroup = e.target.closest('.action-group');
      if (actionGroup) {
        cancelHide();
        return;
      }
    });

    svg.addEventListener('mouseout', (e) => {
      const related = e.relatedTarget;
      if (related && (related.closest('.tree-node') || related.closest('.action-group'))) return;
      scheduleHide();
    });

    // Wire up click events on action buttons
    svg.addEventListener('click', (e) => {
      const btn = e.target.closest('.tree-action-btn');
      if (!btn) return;
      e.stopPropagation();
      const action = btn.dataset.action;
      const personId = btn.dataset.personId;
      if (action && personId) {
        handleAction(action, personId);
      }
    });

    // Right-click context menu on nodes
    svg.addEventListener('contextmenu', (e) => {
      const node = e.target.closest('.tree-node');
      if (!node) return;
      e.preventDefault();
      const personId = node.dataset.personId;
      if (personId) showContextMenu(e, personId);
    });

    treeContainer.appendChild(svg);
    root.appendChild(treeContainer);

    // Legend
    root.appendChild(TreeLegend());

    // Analysis panel
    const analyzer = new TreeAnalyzer(familyStore);
    const report = analyzer.generateReport();

    const analysisPanel = h('div', { className: 'analysis-panel' }, [
      h('h3', {}, 'Inheritance Analysis'),
      ...report.summary.map(line => h('div', { className: 'analysis-item' }, line)),
    ]);

    if (report.affected.length > 0) {
      analysisPanel.appendChild(h('div', { style: 'margin-top: 0.75rem' }, [
        h('strong', { style: 'font-size: 0.85rem' }, 'Affected Members:'),
        ...report.affected.map(p =>
          h('div', { className: 'analysis-item' }, [
            h('span', { className: 'analysis-tag', style: 'background: var(--color-affected)' }, p.xlhStatus),
            ` ${p.name}`,
            p.isSpontaneous ? h('span', { className: 'analysis-tag', style: 'background: var(--color-spontaneous); margin-left: 0.5rem' }, 'spontaneous') : '',
          ])
        ),
      ]));
    }

    if (report.carriers.length > 0) {
      analysisPanel.appendChild(h('div', { style: 'margin-top: 0.75rem' }, [
        h('strong', { style: 'font-size: 0.85rem' }, 'Identified Carriers:'),
        ...report.carriers.map(p => {
          const color = p.computedStatus === 'carrier_probable' ? 'var(--color-carrier-probable)' : 'var(--color-carrier-possible)';
          return h('div', { className: 'analysis-item' }, [
            h('span', { className: 'analysis-tag', style: `background: ${color}` }, p.computedStatus.replace('_', ' ')),
            ` ${p.name}`,
            p.probability !== null ? ` (${Math.round(p.probability * 100)}% probability)` : '',
          ]);
        }),
      ]));
    }

    root.appendChild(analysisPanel);
  }

  // === Action Handlers ===

  function handleAction(action, personId) {
    const person = familyStore.getPerson(personId);
    if (!person) return;

    switch (action) {
      case 'add-parent': openAddParentModal(person); break;
      case 'add-spouse': openAddSpouseModal(person); break;
      case 'add-child': openAddChildModal(person); break;
      case 'add-sibling': openAddSiblingModal(person); break;
    }
  }

  function openAddProbandModal() {
    const form = PersonForm();
    Modal({
      title: 'Add First Family Member (Proband)',
      content: form,
      saveLabel: 'Add',
      onSave: () => {
        if (!form.isValid()) return false;
        const vals = form.getValues();
        familyStore.createPerson({
          ...vals,
          relationship: RELATIONSHIP.PROBAND,
          generation: GENERATION.PROBAND,
        });
        render();
      },
    });
  }

  function openAddParentModal(target) {
    const existingParents = familyStore.getParents(target.id);
    // If one parent exists, pre-select opposite sex
    let sexDefault = '';
    if (existingParents.length === 1) {
      sexDefault = existingParents[0].sex === SEX.MALE ? SEX.FEMALE : SEX.MALE;
    }

    const form = PersonForm({ sex: sexDefault });
    Modal({
      title: `Add Parent of ${target.name}`,
      content: form,
      saveLabel: 'Add',
      onSave: () => {
        if (!form.isValid()) return false;
        const vals = form.getValues();
        const parent = familyStore.createPerson({
          ...vals,
          relationship: RELATIONSHIP.PARENT,
          generation: target.generation - 1,
        });
        familyStore.setParentChild(parent.id, target.id);

        // Auto-link both parents as spouses if two parents now exist
        const parents = familyStore.getParents(target.id);
        if (parents.length === 2 && !parents[0].spouseId) {
          familyStore.setSpouse(parents[0].id, parents[1].id);
        }

        render();
      },
    });
  }

  function openAddSpouseModal(target) {
    const oppositeSex = target.sex === SEX.MALE ? SEX.FEMALE : SEX.MALE;
    const form = PersonForm({ sex: oppositeSex, sexLocked: false });
    Modal({
      title: `Add Spouse of ${target.name}`,
      content: form,
      saveLabel: 'Add',
      onSave: () => {
        if (!form.isValid()) return false;
        const vals = form.getValues();
        const spouse = familyStore.createPerson({
          ...vals,
          relationship: RELATIONSHIP.SPOUSE,
          generation: target.generation,
        });
        familyStore.setSpouse(target.id, spouse.id);
        // Link spouse as parent of target's existing children
        for (const cid of (target.childIds || [])) {
          familyStore.setParentChild(spouse.id, cid);
        }
        render();
      },
    });
  }

  function openAddChildModal(target) {
    const form = PersonForm();
    Modal({
      title: `Add Child of ${target.name}`,
      content: form,
      saveLabel: 'Add',
      onSave: () => {
        if (!form.isValid()) return false;
        const vals = form.getValues();
        const child = familyStore.createPerson({
          ...vals,
          relationship: RELATIONSHIP.CHILD,
          generation: target.generation + 1,
        });
        familyStore.setParentChild(target.id, child.id);
        // Also link spouse as parent
        if (target.spouseId) {
          familyStore.setParentChild(target.spouseId, child.id);
        }
        render();
      },
    });
  }

  function openAddSiblingModal(target) {
    const form = PersonForm();
    Modal({
      title: `Add Sibling of ${target.name}`,
      content: form,
      saveLabel: 'Add',
      onSave: () => {
        if (!form.isValid()) return false;
        const vals = form.getValues();
        const sibling = familyStore.createPerson({
          ...vals,
          relationship: target.relationship === RELATIONSHIP.PROBAND ? RELATIONSHIP.CHILD : target.relationship,
          generation: target.generation,
        });
        familyStore.setSibling(target.id, sibling.id);
        // Share the same parents — insert before target so sibling appears to the left
        for (const pid of target.parentIds) {
          familyStore.setParentChild(pid, sibling.id, { before: target.id });
        }
        render();
      },
    });
  }

  function openEditModal(person) {
    const form = PersonForm({
      name: person.name,
      sex: person.sex,
      xlhStatus: person.xlhStatus,
      sexLocked: false,
    });

    const removeBtn = h('button', {
      className: 'btn btn-danger',
      onClick: () => {
        if (confirm(`Remove ${person.name} from the tree?`)) {
          modal.close();
          familyStore.removePerson(person.id);
          render();
        }
      },
    }, 'Remove from Tree');

    const modal = Modal({
      title: `Edit ${person.name} (${relationshipLabel(person)})`,
      content: form,
      footerLeft: removeBtn,
      onSave: () => {
        if (!form.isValid()) return false;
        familyStore.updatePerson(person.id, form.getValues());
        render();
      },
    });
  }

  function showContextMenu(event, personId) {
    const person = familyStore.getPerson(personId);
    if (!person) return;

    clearElement(contextMenu);

    const items = [];

    items.push({ label: 'Edit', action: () => openEditModal(person) });

    if (person.parentIds.length < 2) {
      items.push({ label: 'Add Parent', action: () => openAddParentModal(person) });
    }
    if (!person.spouseId) {
      items.push({ label: 'Add Spouse', action: () => openAddSpouseModal(person) });
    }
    if (person.spouseId || person.relationship === RELATIONSHIP.PROBAND) {
      items.push({ label: 'Add Child', action: () => openAddChildModal(person) });
    }
    if (person.parentIds.length > 0) {
      items.push({ label: 'Add Sibling', action: () => openAddSiblingModal(person) });
    }

    items.push({ label: 'Remove', danger: true, action: () => {
      if (confirm(`Remove ${person.name} from the tree?`)) {
        familyStore.removePerson(person.id);
        render();
      }
    }});

    for (const item of items) {
      const menuItem = h('div', {
        className: 'context-menu-item' + (item.danger ? ' context-menu-danger' : ''),
        onClick: (e) => {
          e.stopPropagation();
          hideContextMenu();
          item.action();
        },
      }, item.label);
      contextMenu.appendChild(menuItem);
    }

    contextMenu.style.display = 'block';
    contextMenu.style.left = event.clientX + 'px';
    contextMenu.style.top = event.clientY + 'px';

    // Keep within viewport
    requestAnimationFrame(() => {
      const rect = contextMenu.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        contextMenu.style.left = (window.innerWidth - rect.width - 8) + 'px';
      }
      if (rect.bottom > window.innerHeight) {
        contextMenu.style.top = (window.innerHeight - rect.height - 8) + 'px';
      }
    });
  }

  render();
  return root;
}
