function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

export function spouseLine(x1, y1, x2, y2, color) {
  return svgEl('line', {
    x1, y1, x2, y2,
    class: 'tree-connector',
    ...(color ? { stroke: color, 'stroke-width': 2 } : {}),
  });
}

export function siblingBar(parentMidX, parentY, childPositions, nodeSize, { parentColor, childColors } = {}) {
  const half = nodeSize / 2;
  const g = svgEl('g');

  if (childPositions.length === 0) return g;

  const midY = parentY + half + 30;

  // Vertical from parent couple midpoint down
  g.appendChild(svgEl('line', {
    x1: parentMidX, y1: parentY + half,
    x2: parentMidX, y2: midY,
    class: 'tree-connector',
    ...(parentColor ? { stroke: parentColor, 'stroke-width': 2 } : {}),
  }));

  if (childPositions.length === 1) {
    const [cx, cy, color] = childPositions[0];
    const lineColor = color || parentColor;
    g.appendChild(svgEl('line', {
      x1: parentMidX, y1: midY,
      x2: cx, y2: cy - half,
      class: 'tree-connector',
      ...(lineColor ? { stroke: lineColor, 'stroke-width': 2 } : {}),
    }));
  } else {
    // Horizontal bar
    const xs = childPositions.map(([x]) => x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);

    g.appendChild(svgEl('line', {
      x1: minX, y1: midY,
      x2: maxX, y2: midY,
      class: 'tree-connector',
      ...(parentColor ? { stroke: parentColor, 'stroke-width': 2 } : {}),
    }));

    // Vertical down to each child — colored per child
    for (const [cx, cy, color] of childPositions) {
      const lineColor = color || parentColor;
      g.appendChild(svgEl('line', {
        x1: cx, y1: midY,
        x2: cx, y2: cy - half,
        class: 'tree-connector',
        ...(lineColor ? { stroke: lineColor, 'stroke-width': 2 } : {}),
      }));
    }
  }

  return g;
}
