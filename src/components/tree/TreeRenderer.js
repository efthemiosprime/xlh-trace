import { familyStore } from '../../data/FamilyStore.js';
import { renderTreeNode, NODE_SIZE } from './TreeNode.js';
import { spouseLine, siblingBar } from './TreeConnectors.js';
import { SEX, XLH_STATUS } from '../../data/constants.js';

const COLOR_AFFECTED = '#E53E3E';
const COLOR_CARRIER_PROBABLE = '#ED64A6';
const COLOR_CARRIER_POSSIBLE = '#ECC94B';
const COLOR_DEFAULT = null; // falls back to CSS

// Spacing accounts for name labels (~80px wide) not just the 36px node
export const NODE_SLOT = 120;
export const V_GAP = 130;
export const COUPLE_GAP = 100;
export const PADDING = 60;

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

    // === GATHER FAMILY DATA ===
    const parents = familyStore.getParents(proband.id);
    const mother = parents.find(p => p.sex === SEX.FEMALE);
    const father = parents.find(p => p.sex === SEX.MALE);

    const maternalSiblings = mother ? familyStore.getSiblings(mother.id) : [];
    const maternalGPs = mother ? familyStore.getParents(mother.id) : [];
    const paternalSiblings = father ? familyStore.getSiblings(father.id) : [];
    const paternalGPs = father ? familyStore.getParents(father.id) : [];

    const probandSpouse = proband.spouseId ? familyStore.getPerson(proband.spouseId) : null;

    let spouseParentsArr = [], spouseMother = null, spouseFather = null;
    let spouseMatSiblings = [], spousePatSiblings = [];
    let spouseMatGPs = [], spousePatGPs = [];

    if (probandSpouse) {
      spouseParentsArr = familyStore.getParents(probandSpouse.id);
      spouseMother = spouseParentsArr.find(p => p.sex === SEX.FEMALE);
      spouseFather = spouseParentsArr.find(p => p.sex === SEX.MALE);
      spouseMatSiblings = spouseMother ? familyStore.getSiblings(spouseMother.id) : [];
      spouseMatGPs = spouseMother ? familyStore.getParents(spouseMother.id) : [];
      spousePatSiblings = spouseFather ? familyStore.getSiblings(spouseFather.id) : [];
      spousePatGPs = spouseFather ? familyStore.getParents(spouseFather.id) : [];
    }

    // === COMPUTE PARENT COUPLE GAPS (may widen for grandparent overlap) ===
    const maternalGPRightExtent = maternalGPs.length === 2 ? COUPLE_GAP / 2 : 0;
    const paternalGPLeftExtent = paternalGPs.length === 2 ? COUPLE_GAP / 2 : 0;
    let effectiveCoupleGap = COUPLE_GAP;
    if (maternalGPRightExtent + paternalGPLeftExtent > 0) {
      const minGap = maternalGPRightExtent + NODE_SLOT + paternalGPLeftExtent;
      effectiveCoupleGap = Math.max(COUPLE_GAP, minGap);
    }
    const halfCouple = effectiveCoupleGap / 2;

    const spouseMatGPRight = spouseMatGPs.length === 2 ? COUPLE_GAP / 2 : 0;
    const spousePatGPLeft = spousePatGPs.length === 2 ? COUPLE_GAP / 2 : 0;
    let spouseEffectiveCoupleGap = COUPLE_GAP;
    if (spouseMatGPRight + spousePatGPLeft > 0) {
      const minGap = spouseMatGPRight + NODE_SLOT + spousePatGPLeft;
      spouseEffectiveCoupleGap = Math.max(COUPLE_GAP, minGap);
    }
    const spouseHalfCouple = spouseEffectiveCoupleGap / 2;

    // === COMPUTE PROBAND-SPOUSE GAP ===
    // Must be wide enough so parent rows centered above each child don't overlap
    const matSibWidth = maternalSiblings.length * NODE_SLOT;
    const patSibWidth = paternalSiblings.length * NODE_SLOT;
    const spouseMatSibWidth = spouseMatSiblings.length * NODE_SLOT;

    let probandSpouseGap = COUPLE_GAP;
    if (probandSpouse) {
      // Right extent from proband's x: father side + paternal siblings
      const probandParentRight = parents.length > 0 ? halfCouple + patSibWidth : 0;
      // Left extent from spouse's x: mother side + maternal siblings
      const spouseParentLeft = spouseParentsArr.length > 0 ? spouseHalfCouple + spouseMatSibWidth : 0;
      if (probandParentRight + spouseParentLeft > 0) {
        probandSpouseGap = Math.max(COUPLE_GAP, probandParentRight + NODE_SLOT + spouseParentLeft);
      }
    }

    // === PLACE PROBAND + SPOUSE (bottom-up: children first, then parents above) ===
    const probandX = PADDING + (parents.length > 0 ? matSibWidth + halfCouple : 0);
    const probandY = genYMap[proband.generation];

    if (probandSpouse) {
      place(proband, probandX, probandY);
      place(probandSpouse, probandX + probandSpouseGap, probandY);
    } else {
      place(proband, probandX, probandY);
    }

    // === PROBAND'S PARENTS centered above proband ===
    const parentY = mother ? genYMap[mother.generation] : (father ? genYMap[father.generation] : PADDING);

    let cursor = probandX - halfCouple - matSibWidth;
    for (const sib of maternalSiblings) {
      place(sib, cursor, genYMap[sib.generation]);
      cursor += NODE_SLOT;
    }

    if (mother) place(mother, probandX - halfCouple, parentY);
    if (father) place(father, probandX + halfCouple, parentY);

    cursor = probandX + halfCouple + NODE_SLOT;
    for (const sib of paternalSiblings) {
      place(sib, cursor, genYMap[sib.generation]);
      cursor += NODE_SLOT;
    }

    // === PROBAND'S GRANDPARENTS centered above their children group ===
    if (maternalGPs.length > 0) {
      placeCouple(maternalGPs, getGroupCenter([mother, ...maternalSiblings]), genYMap[maternalGPs[0].generation]);
    }
    if (paternalGPs.length > 0) {
      placeCouple(paternalGPs, getGroupCenter([father, ...paternalSiblings]), genYMap[paternalGPs[0].generation]);
    }

    // === SPOUSE'S PARENTS centered above spouse ===
    if (probandSpouse && spouseParentsArr.length > 0) {
      const spouseX = positions.get(probandSpouse.id).x;
      const spouseParentY = spouseMother ? genYMap[spouseMother.generation] : (spouseFather ? genYMap[spouseFather.generation] : PADDING);

      let spouseCursor = spouseX - spouseHalfCouple - spouseMatSibWidth;
      for (const sib of spouseMatSiblings) {
        place(sib, spouseCursor, genYMap[sib.generation]);
        spouseCursor += NODE_SLOT;
      }

      if (spouseMother) place(spouseMother, spouseX - spouseHalfCouple, spouseParentY);
      if (spouseFather) place(spouseFather, spouseX + spouseHalfCouple, spouseParentY);

      spouseCursor = spouseX + spouseHalfCouple + NODE_SLOT;
      for (const sib of spousePatSiblings) {
        place(sib, spouseCursor, genYMap[sib.generation]);
        spouseCursor += NODE_SLOT;
      }

      // Spouse's grandparents
      if (spouseMatGPs.length > 0) {
        placeCouple(spouseMatGPs, getGroupCenter([spouseMother, ...spouseMatSiblings]), genYMap[spouseMatGPs[0].generation]);
      }
      if (spousePatGPs.length > 0) {
        placeCouple(spousePatGPs, getGroupCenter([spouseFather, ...spousePatSiblings]), genYMap[spousePatGPs[0].generation]);
      }

      cursor = spouseCursor;
    }

    // === CHILDREN of proband centered under proband couple ===
    const probandChildren = findChildren(proband);
    if (probandChildren.length > 0) {
      const coupleMidX = probandSpouse
        ? (positions.get(proband.id).x + positions.get(probandSpouse.id).x) / 2
        : positions.get(proband.id).x;
      const childGen = proband.generation + 1;
      const childY = genYMap[childGen] ?? (genYMap[proband.generation] + V_GAP);
      placeChildrenCentered(probandChildren, coupleMidX, childY);
    }

    // === Place unplaced spouses next to their partner ===
    for (const person of familyStore.getAll()) {
      if (positions.has(person.id)) continue;
      if (!person.spouseId) continue;
      const spousePos = positions.get(person.spouseId);
      if (!spousePos) continue;
      // Place spouse to the right of their partner
      place(person, spousePos.x + COUPLE_GAP, spousePos.y);
    }

    // === GENERIC: place any remaining unplaced people under their parents ===
    // Collect parent groups to re-center all children evenly
    const handledParentGroups = new Set();
    for (const person of familyStore.getAll()) {
      if (positions.has(person.id)) continue;

      const personParents = familyStore.getParents(person.id);
      const placedParent = personParents.find(p => positions.has(p.id));

      if (placedParent) {
        // Build a unique key for the parent couple
        const coupleKey = placedParent.spouseId
          ? [placedParent.id, placedParent.spouseId].sort().join('-')
          : placedParent.id;
        if (handledParentGroups.has(coupleKey)) continue;
        handledParentGroups.add(coupleKey);

        const parentPos = positions.get(placedParent.id);
        const spousePos = placedParent.spouseId ? positions.get(placedParent.spouseId) : null;
        const midX = spousePos ? (parentPos.x + spousePos.x) / 2 : parentPos.x;
        const childY = genYMap[person.generation] ?? (parentPos.y + V_GAP);

        // Get ALL children of this couple, including already-placed ones
        const allChildren = findChildren(placedParent);
        // Clear existing positions so we can re-center evenly
        for (const child of allChildren) {
          positions.delete(child.id);
        }
        placeChildrenCentered(allChildren, midX, childY);
      } else {
        place(person, cursor + NODE_SLOT, genYMap[person.generation] ?? PADDING);
        cursor += NODE_SLOT;
      }
    }

    // === Center the tree ===
    let minX = Infinity, maxX = 0, maxY = 0;
    for (const { x, y } of positions.values()) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    if (minX === Infinity) minX = 0;

    // Shift all positions so tree is centered with equal padding on both sides
    const offsetX = PADDING - minX;
    for (const pos of positions.values()) {
      pos.x += offsetX;
    }

    const svgWidth = (maxX - minX) + PADDING * 2;
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
    for (const p of familyStore.getAll()) {
      if (p.parentIds && p.parentIds.includes(person.id)) {
        ids.add(p.id);
      }
    }
    return [...ids].map(id => familyStore.getPerson(id)).filter(Boolean);
  }

  function placeChildrenCentered(children, centerX, y) {
    if (children.length === 0) return;
    // Build slots: each child + optional spouse to the right
    const slots = children.map(child => {
      const hasSpouse = child.spouseId && !children.find(c => c.id === child.spouseId);
      return { child, hasSpouse, width: hasSpouse ? COUPLE_GAP : 0 };
    });
    // Total width from first child center to last element center
    let totalWidth = 0;
    for (let i = 0; i < slots.length; i++) {
      totalWidth += slots[i].width; // spouse space within this slot
      if (i < slots.length - 1) totalWidth += NODE_SLOT; // gap to next child
    }
    let x = centerX - totalWidth / 2;
    for (const slot of slots) {
      place(slot.child, x, y);
      if (slot.hasSpouse) {
        const spouse = familyStore.getPerson(slot.child.spouseId);
        if (spouse) place(spouse, x + COUPLE_GAP, y);
        x += COUPLE_GAP;
      }
      x += NODE_SLOT;
    }
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

      // Trunk color: for X-linked, mother is key carrier for all children,
      // but father's X matters for daughters. Use the mother's color as primary.
      const mother = person.sex === SEX.FEMALE ? person : spouse;
      const father = person.sex === SEX.MALE ? person : spouse;
      const motherColor = mother ? personColor(mother) : COLOR_DEFAULT;
      const fatherColor = father ? personColor(father) : COLOR_DEFAULT;
      // Trunk shows highest inheritance potential in the couple
      const parentColor = getHigherColor(motherColor, fatherColor);

      const childPositions = [];
      for (const child of children) {
        const cp = positions.get(child.id);
        if (cp) {
          // X-linked: males get X only from mother, females get X from both parents
          let childColor = personColor(child);
          if (!childColor && child.sex === SEX.FEMALE) {
            // Daughter with no computed status: show parent path color
            childColor = getHigherColor(motherColor, fatherColor);
          } else if (!childColor && child.sex === SEX.MALE) {
            // Son with no computed status: only mother's X matters
            childColor = motherColor;
          }
          childPositions.push([cp.x, cp.y, childColor]);
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

  function getHigherColor(a, b) {
    const rank = [COLOR_AFFECTED, COLOR_CARRIER_PROBABLE, COLOR_CARRIER_POSSIBLE];
    const ra = rank.indexOf(a);
    const rb = rank.indexOf(b);
    if (ra >= 0 && rb >= 0) return ra < rb ? a : b;
    if (ra >= 0) return a;
    if (rb >= 0) return b;
    return COLOR_DEFAULT;
  }

  function getPositions() {
    return new Map(positions);
  }

  return { render, getPositions };
}
