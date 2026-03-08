import { XLH_STATUS, RELATIONSHIP } from '../../data/constants.js';

const NODE_SIZE = 36;
const HALF = NODE_SIZE / 2;

export function renderTreeNode(person, x, y) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'tree-node');
  g.setAttribute('data-person-id', person.id);
  g.setAttribute('transform', `translate(${x}, ${y})`);

  // Proband highlight ring
  if (person.relationship === RELATIONSHIP.PROBAND) {
    const ring = person.sex === 'male'
      ? svgEl('rect', {
          x: -(HALF + 5), y: -(HALF + 5),
          width: NODE_SIZE + 10, height: NODE_SIZE + 10,
          rx: 7, fill: 'none',
          stroke: '#2D3748', 'stroke-width': 2.5,
          'stroke-dasharray': '4 2',
        })
      : svgEl('circle', {
          cx: 0, cy: 0, r: HALF + 5,
          fill: 'none',
          stroke: '#2D3748', 'stroke-width': 2.5,
          'stroke-dasharray': '4 2',
        });
    g.appendChild(ring);
  }

  const color = getColor(person);

  if (person.sex === 'male') {
    // Square for male
    const rect = svgEl('rect', {
      x: -HALF, y: -HALF, width: NODE_SIZE, height: NODE_SIZE,
      rx: 4,
      fill: person.xlhStatus === XLH_STATUS.AFFECTED ? color : 'white',
      stroke: color,
      'stroke-width': 2.5,
    });
    g.appendChild(rect);

    // Half-fill for carriers
    if (person.computedStatus === 'carrier_probable' || person.computedStatus === 'carrier_possible') {
      const halfFill = svgEl('rect', {
        x: -HALF, y: -HALF, width: HALF, height: NODE_SIZE,
        rx: 0,
        fill: getComputedColor(person),
        opacity: 0.7,
      });
      // Clip to the square
      const clipId = `clip-${person.id}`;
      const clipPath = svgEl('clipPath', { id: clipId });
      clipPath.appendChild(svgEl('rect', { x: -HALF, y: -HALF, width: NODE_SIZE, height: NODE_SIZE, rx: 4 }));
      g.appendChild(clipPath);
      halfFill.setAttribute('clip-path', `url(#${clipId})`);
      g.appendChild(halfFill);
    }
  } else {
    // Circle for female
    const circle = svgEl('circle', {
      cx: 0, cy: 0, r: HALF,
      fill: person.xlhStatus === XLH_STATUS.AFFECTED ? color : 'white',
      stroke: color,
      'stroke-width': 2.5,
    });
    g.appendChild(circle);

    if (person.computedStatus === 'carrier_probable' || person.computedStatus === 'carrier_possible') {
      const clipId = `clip-${person.id}`;
      const clipPath = svgEl('clipPath', { id: clipId });
      clipPath.appendChild(svgEl('circle', { cx: 0, cy: 0, r: HALF }));
      g.appendChild(clipPath);

      const halfFill = svgEl('rect', {
        x: -HALF, y: -HALF, width: HALF, height: NODE_SIZE,
        fill: getComputedColor(person),
        opacity: 0.7,
        'clip-path': `url(#${clipId})`,
      });
      g.appendChild(halfFill);
    }
  }

  // Inner label: probability % or ? for unknown
  const hasProb = person.probability !== null && person.probability > 0 && person.xlhStatus !== XLH_STATUS.AFFECTED;
  const isUnknown = person.xlhStatus === XLH_STATUS.UNKNOWN && !person.computedStatus;

  if (hasProb) {
    const isFilledBg = false; // carriers have half-fill, use dark text
    const probLabel = svgEl('text', {
      x: 0, y: 5,
      'text-anchor': 'middle',
      'font-size': '11',
      'font-weight': 'bold',
      fill: '#1a202c',
    });
    probLabel.textContent = `${Math.round(person.probability * 100)}%`;
    g.appendChild(probLabel);
  } else if (isUnknown) {
    const text = svgEl('text', {
      x: 0, y: 5,
      'text-anchor': 'middle',
      'font-size': '16',
      'font-weight': 'bold',
      fill: '#718096',
    });
    text.textContent = '?';
    g.appendChild(text);
  }

  // Proband arrow indicator
  if (person.relationship === RELATIONSHIP.PROBAND) {
    const arrow = svgEl('polygon', {
      points: `${-4},${-(HALF + 14)} ${4},${-(HALF + 14)} ${0},${-(HALF + 8)}`,
      fill: '#2D3748',
    });
    g.appendChild(arrow);
  }

  // Spontaneous marker
  if (person.isSpontaneous) {
    const marker = svgEl('circle', {
      cx: HALF - 2, cy: -HALF + 2, r: 5,
      fill: '#DD6B20',
      stroke: 'white',
      'stroke-width': 1.5,
    });
    g.appendChild(marker);
  }

  // Name label — word-wrap into stacked lines
  const nameText = svgEl('text', {
    x: 0,
    'text-anchor': 'middle',
    'font-size': '11',
    fill: '#1a202c',
  });

  const nameLines = wrapName(person.name);
  let lineY = HALF + 14;
  for (const line of nameLines) {
    const tspan = svgEl('tspan', { x: 0, y: lineY });
    tspan.textContent = line;
    nameText.appendChild(tspan);
    lineY += 13;
  }
  g.appendChild(nameText);


  return g;
}

// Split name into lines, max ~12 chars per line, breaking on word boundaries
function wrapName(name) {
  const MAX_LINE = 12;
  const words = name.trim().split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    if (current && (current.length + 1 + word.length) > MAX_LINE) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) lines.push(current);

  return lines;
}

function getColor(person) {
  if (person.xlhStatus === XLH_STATUS.AFFECTED) return '#E53E3E';
  if (person.xlhStatus === XLH_STATUS.UNAFFECTED) return '#3182CE';
  if (person.computedStatus === 'carrier_probable') return '#ED64A6';
  if (person.computedStatus === 'carrier_possible') return '#ECC94B';
  return '#A0AEC0';
}

function getComputedColor(person) {
  if (person.computedStatus === 'carrier_probable') return '#ED64A6';
  if (person.computedStatus === 'carrier_possible') return '#ECC94B';
  return '#A0AEC0';
}

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

export { NODE_SIZE };
