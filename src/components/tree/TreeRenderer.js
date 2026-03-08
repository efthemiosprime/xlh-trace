import { familyStore } from '../../data/FamilyStore.js';
import { renderTreeNode, NODE_SIZE } from './TreeNode.js';
import { spouseLine, siblingBar } from './TreeConnectors.js';
import { SEX, XLH_STATUS } from '../../data/constants.js';

const COLOR_AFFECTED = '#E53E3E';
const COLOR_CARRIER_PROBABLE = '#ED64A6';
const COLOR_CARRIER_POSSIBLE = '#ECC94B';
const COLOR_DEFAULT = null; // falls back to CSS

// Spacing accounts for name labels (~80px wide) not just the 36px node
const NODE_SLOT = 90;
const V_GAP = 120;
const COUPLE_GAP = 70;
const PADDING = 60;

export function TreeRenderer({ onNodeClick }) {
  const positions = new Map();

  function render() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'tree-svg');
    positions.clear();

    const proband = familyStore.getProband();
    if (!proband) return svg;

    // Generation Y positions
    const genYMap = {};
    const allGens = new Set();
    for (const p of familyStore.getAll()) allGens.add(p.generation);
    [...allGens].sort((a, b) => a - b).forEach((gen, i) => {
      genYMap[gen] = PADDING + i * V_GAP;
    });

    // Family structure
    const parents = familyStore.getParents(proband.id);
    const mother = parents.find(p => p.sex === SEX.FEMALE);
    const father = parents.find(p => p.sex === SEX.MALE);

    const maternalSiblings = mother ? familyStore.getSiblings(mother.id) : [];
    const maternalGPs = mother ? familyStore.getParents(mother.id) : [];
    const paternalSiblings = father ? familyStore.getSiblings(father.id) : [];
    const paternalGPs = father ? familyStore.getParents(father.id) : [];

    // === PARENT GENERATION ROW ===
    // [maternal_siblings...] [mother] ---spouse--- [father] [paternal_siblings...]
    let cursor = PADDING;

    for (const sib of maternalSiblings) {
      place(sib, cursor, genYMap[sib.generation]);
      cursor += NODE_SLOT;
    }

    if (mother) {
      place(mother, cursor, genYMap[mother.generation]);
      cursor += COUPLE_GAP;
    }

    if (father) {
      place(father, cursor, genYMap[father.generation]);
      cursor += NODE_SLOT;
    }

    for (const sib of paternalSiblings) {
      place(sib, cursor, genYMap[sib.generation]);
      cursor += NODE_SLOT;
    }

    // === GRANDPARENTS centered above their children group ===
    if (maternalGPs.length > 0) {
      placeCouple(maternalGPs, getGroupCenter([mother, ...maternalSiblings]), genYMap[maternalGPs[0].generation]);
    }
    if (paternalGPs.length > 0) {
      placeCouple(paternalGPs, getGroupCenter([father, ...paternalSiblings]), genYMap[paternalGPs[0].generation]);
    }

    // === PROBAND + SPOUSE centered under parents ===
    const probandSpouse = proband.spouseId ? familyStore.getPerson(proband.spouseId) : null;
    const probandX = getParentMidX(mother, father) ?? PADDING;

    if (probandSpouse) {
      // Place proband and spouse as a couple
      place(proband, probandX - COUPLE_GAP / 2, genYMap[proband.generation]);
      place(probandSpouse, probandX + COUPLE_GAP / 2, genYMap[proband.generation]);
    } else {
      place(proband, probandX, genYMap[proband.generation]);
    }

    // === CHILDREN of proband centered under proband couple ===
    const probandChildren = findChildren(proband);
    if (probandChildren.length > 0) {
      const coupleMidX = probandSpouse
        ? (positions.get(proband.id).x + positions.get(probandSpouse.id).x) / 2
        : positions.get(proband.id).x;
      const childGen = proband.generation + 1;
      const childY = genYMap[childGen] ?? (genYMap[proband.generation] + V_GAP);
      const totalWidth = (probandChildren.length - 1) * NODE_SLOT;
      let cx = coupleMidX - totalWidth / 2;
      for (const child of probandChildren) {
        place(child, Math.max(PADDING, cx), childY);
        cx += NODE_SLOT;
      }
    }

    // === GENERIC: place any remaining unplaced people under their parents ===
    for (const person of familyStore.getAll()) {
      if (positions.has(person.id)) continue;

      // Try to find a placed parent and position under them
      const personParents = familyStore.getParents(person.id);
      const placedParent = personParents.find(p => positions.has(p.id));

      if (placedParent) {
        const parentPos = positions.get(placedParent.id);
        const spouse = placedParent.spouseId ? positions.get(placedParent.spouseId) : null;
        const midX = spouse ? (parentPos.x + spouse.x) / 2 : parentPos.x;
        const childY = genYMap[person.generation] ?? (parentPos.y + V_GAP);

        // Find all siblings being placed under same parents
        const siblings = findChildren(placedParent).filter(c => !positions.has(c.id));
        const allToPlace = [person, ...siblings.filter(s => s.id !== person.id)];
        const totalWidth = (allToPlace.length - 1) * NODE_SLOT;
        let cx = midX - totalWidth / 2;
        for (const child of allToPlace) {
          place(child, Math.max(PADDING, cx), childY);
          cx += NODE_SLOT;
        }
      } else {
        // Last resort fallback
        place(person, cursor + NODE_SLOT, genYMap[person.generation] ?? PADDING);
        cursor += NODE_SLOT;
      }
    }

    // === Render SVG ===
    let maxX = 0, maxY = 0;
    for (const { x, y } of positions.values()) {
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    const svgWidth = maxX + PADDING * 2;
    const svgHeight = maxY + PADDING + 50;
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    svg.setAttribute('width', Math.max(svgWidth, 300));
    svg.setAttribute('height', svgHeight);

    const connectorGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    drawConnectors(connectorGroup);
    svg.appendChild(connectorGroup);

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.appendChild(defs);

    for (const person of familyStore.getAll()) {
      const pos = positions.get(person.id);
      if (!pos) continue;
      const node = renderTreeNode(person, pos.x, pos.y);
      if (onNodeClick) {
        node.style.cursor = 'pointer';
        node.addEventListener('click', () => onNodeClick(person));
      }
      const clips = node.querySelectorAll('clipPath');
      for (const clip of clips) defs.appendChild(clip);
      svg.appendChild(node);
    }

    return svg;
  }

  // Find children via both forward (childIds) and reverse (parentIds) lookup
  function findChildren(person) {
    const ids = new Set(person.childIds || []);
    if (person.spouseId) {
      const spouse = familyStore.getPerson(person.spouseId);
      if (spouse) for (const cid of (spouse.childIds || [])) ids.add(cid);
    }
    // Also check reverse: anyone whose parentIds includes this person
    for (const p of familyStore.getAll()) {
      if (p.parentIds && p.parentIds.includes(person.id)) {
        ids.add(p.id);
      }
    }
    return [...ids].map(id => familyStore.getPerson(id)).filter(Boolean);
  }

  function place(person, x, y) {
    if (!positions.has(person.id)) {
      positions.set(person.id, { x, y });
    }
  }

  function getGroupCenter(people) {
    const xs = people.filter(Boolean).map(p => positions.get(p.id)?.x).filter(x => x != null);
    if (xs.length === 0) return PADDING;
    return (Math.min(...xs) + Math.max(...xs)) / 2;
  }

  function getParentMidX(mother, father) {
    const mx = mother ? positions.get(mother.id)?.x : null;
    const fx = father ? positions.get(father.id)?.x : null;
    if (mx != null && fx != null) return (mx + fx) / 2;
    return mx ?? fx ?? null;
  }

  function placeCouple(gps, centerX, y) {
    const gf = gps.find(p => p.sex === SEX.MALE);
    const gm = gps.find(p => p.sex === SEX.FEMALE);
    if (gf && gm) {
      place(gf, centerX - COUPLE_GAP / 2, y);
      place(gm, centerX + COUPLE_GAP / 2, y);
    } else if (gps.length === 1) {
      place(gps[0], centerX, y);
    }
  }

  function drawConnectors(g) {
    const all = familyStore.getAll();
    const drawnSpouses = new Set();
    const drawnParentGroups = new Set();

    for (const person of all) {
      // Spouse lines
      if (person.spouseId) {
        const key = [person.id, person.spouseId].sort().join('-');
        if (!drawnSpouses.has(key)) {
          drawnSpouses.add(key);
          const spouse = familyStore.getPerson(person.spouseId);
          const p1 = positions.get(person.id);
          const p2 = positions.get(person.spouseId);
          if (p1 && p2) {
            const half = NODE_SIZE / 2;
            const leftP = p1.x < p2.x ? p1 : p2;
            const rightP = p1.x < p2.x ? p2 : p1;
            // Color spouse line if either partner is on the inheritance path
            const spouseColor = getHigherColor(personColor(person), personColor(spouse));
            g.appendChild(spouseLine(leftP.x + half, leftP.y, rightP.x - half, rightP.y, spouseColor));
          }
        }
      }

      // Parent-child connectors
      const children = findChildren(person);
      if (children.length === 0) continue;

      const pairKey = person.spouseId
        ? [person.id, person.spouseId].sort().join('-')
        : person.id;
      if (drawnParentGroups.has(pairKey)) continue;
      drawnParentGroups.add(pairKey);

      const parentPos = positions.get(person.id);
      const spouse = person.spouseId ? familyStore.getPerson(person.spouseId) : null;
      const spousePos = spouse ? positions.get(spouse.id) : null;
      if (!parentPos) continue;

      const midX = spousePos ? (parentPos.x + spousePos.x) / 2 : parentPos.x;

      // Parent trunk color = strongest status between the couple
      const parentColor = getHigherColor(personColor(person), spouse ? personColor(spouse) : COLOR_DEFAULT);

      const childPositions = [];
      for (const child of children) {
        const cp = positions.get(child.id);
        if (cp) {
          // Each child drop-line colored by the child's own status
          childPositions.push([cp.x, cp.y, personColor(child)]);
        }
      }

      if (childPositions.length > 0) {
        g.appendChild(siblingBar(midX, parentPos.y, childPositions, NODE_SIZE, { parentColor }));
      }
    }
  }

  function personColor(person) {
    if (!person) return COLOR_DEFAULT;
    if (person.xlhStatus === XLH_STATUS.AFFECTED) return COLOR_AFFECTED;
    if (person.computedStatus === 'carrier_probable') return COLOR_CARRIER_PROBABLE;
    if (person.computedStatus === 'carrier_possible') return COLOR_CARRIER_POSSIBLE;
    if (person.probability > 0) return COLOR_CARRIER_POSSIBLE;
    return COLOR_DEFAULT;
  }

  // Return the "stronger" inheritance color (affected > carrier probable > carrier possible > none)
  function getHigherColor(a, b) {
    const rank = [COLOR_AFFECTED, COLOR_CARRIER_PROBABLE, COLOR_CARRIER_POSSIBLE];
    const ra = rank.indexOf(a);
    const rb = rank.indexOf(b);
    if (ra >= 0 && rb >= 0) return ra < rb ? a : b;
    if (ra >= 0) return a;
    if (rb >= 0) return b;
    return COLOR_DEFAULT;
  }

  return { render };
}
