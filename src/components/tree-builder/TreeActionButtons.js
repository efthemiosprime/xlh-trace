import { familyStore } from '../../data/FamilyStore.js';
import { RELATIONSHIP } from '../../data/constants.js';
import { NODE_SLOT, V_GAP, COUPLE_GAP } from '../tree/TreeRenderer.js';
import { NODE_SIZE } from '../tree/TreeNode.js';

const BTN_R = 12;
const HALF_NODE = NODE_SIZE / 2;
// Keep buttons snug to the node edge
const SIDE_OFFSET = HALF_NODE + BTN_R + 8;
const TOP_OFFSET = HALF_NODE + BTN_R + 16;
const BOTTOM_OFFSET = HALF_NODE + BTN_R + 24;
// Min distance before we consider a collision with another node
const COLLISION_R = HALF_NODE + BTN_R + 4;

export function TreeActionButtons({ positions }) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'tree-action-buttons');

  // Collect all node positions for collision checks
  const allPositions = [...positions.values()];

  for (const [personId, pos] of positions) {
    const person = familyStore.getPerson(personId);
    if (!person) continue;

    const personGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    personGroup.setAttribute('class', 'action-group');
    personGroup.setAttribute('data-for-person', personId);

    // Add Parent — above node; try above-left/above-right if center collides
    if (person.parentIds.length < 2) {
      const candidates = [
        { x: pos.x, y: pos.y - TOP_OFFSET },
        { x: pos.x - SIDE_OFFSET, y: pos.y - TOP_OFFSET },
        { x: pos.x + SIDE_OFFSET, y: pos.y - TOP_OFFSET },
      ];
      const spot = candidates.find(c => !hitsNode(c.x, c.y, personId, positions));
      if (spot) {
        addButton(personGroup, spot.x, spot.y, 'add-parent', personId);
      }
    }

    // Add Spouse — beside node; try right first, then left
    if (!person.spouseId) {
      const candidates = [
        { x: pos.x + SIDE_OFFSET, y: pos.y },
        { x: pos.x - SIDE_OFFSET, y: pos.y },
      ];
      const spot = candidates.find(c => !hitsNode(c.x, c.y, personId, positions));
      if (spot) {
        addButton(personGroup, spot.x, spot.y, 'add-spouse', personId);
      }
    }

    // Add Child — below node
    if (person.spouseId || person.relationship === RELATIONSHIP.PROBAND) {
      // Place below the midpoint between this person and their spouse
      const spouse = person.spouseId ? positions.get(person.spouseId) : null;
      const midX = spouse ? (pos.x + spouse.x) / 2 : pos.x;
      const bx = midX, by = pos.y + BOTTOM_OFFSET;
      if (!hitsNode(bx, by, personId, positions)) {
        addButton(personGroup, bx, by, 'add-child', personId);
      }
    }

    // Add Sibling — try left first, then right
    if (person.parentIds.length > 0) {
      const candidates = [
        { x: pos.x - SIDE_OFFSET, y: pos.y },
        { x: pos.x + SIDE_OFFSET, y: pos.y },
      ];
      const spot = candidates.find(c => !hitsNode(c.x, c.y, personId, positions));
      if (spot) {
        addButton(personGroup, spot.x, spot.y, 'add-sibling', personId);
      }
    }

    g.appendChild(personGroup);
  }

  return g;
}

function hitsNode(bx, by, skipId, positions) {
  for (const [id, p] of positions) {
    if (id === skipId) continue;
    const dx = Math.abs(bx - p.x);
    const dy = Math.abs(by - p.y);
    if (dx < COLLISION_R && dy < COLLISION_R) return true;
  }
  return false;
}

function addButton(parent, x, y, action, personId) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'tree-action-btn');
  g.setAttribute('data-action', action);
  g.setAttribute('data-person-id', personId);

  const circle = svgEl('circle', {
    cx: x, cy: y, r: BTN_R,
    fill: 'white',
    stroke: '#A0AEC0',
    'stroke-width': 1.5,
    'stroke-dasharray': '3 2',
  });
  g.appendChild(circle);

  const plus = svgEl('text', {
    x, y: y + 4,
    'text-anchor': 'middle',
    'font-size': '14',
    'font-weight': 'bold',
    fill: '#A0AEC0',
    'pointer-events': 'none',
  });
  plus.textContent = '+';
  g.appendChild(plus);

  parent.appendChild(g);
}

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}
