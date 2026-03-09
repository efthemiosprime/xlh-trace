function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

function colorAttrs(color) {
  if (!color) return {};
  return { style: `stroke: ${color}; stroke-width: 2` };
}

export function spouseLine(x1, y1, x2, y2, color) {
  return svgEl('line', {
    x1, y1, x2, y2,
    class: 'tree-connector',
    ...colorAttrs(color),
  });
}

export function siblingBar(parentMidX, parentY, childPositions, nodeSize, { parentColor } = {}) {
  const half = nodeSize / 2;
  const g = svgEl('g');

  if (childPositions.length === 0) return g;

  const midY = parentY + half + 30;

  // Vertical from parent couple midpoint down
  g.appendChild(svgEl('line', {
    x1: parentMidX, y1: parentY + half,
    x2: parentMidX, y2: midY,
    class: 'tree-connector',
    ...colorAttrs(parentColor),
  }));

  if (childPositions.length === 1) {
    const [cx, cy, color] = childPositions[0];
    // Trunk segment from parent bar to child — uses parent color
    g.appendChild(svgEl('line', {
      x1: parentMidX, y1: midY,
      x2: cx, y2: midY,
      class: 'tree-connector',
      ...colorAttrs(parentColor),
    }));
    // Drop to child — uses child's own color only
    g.appendChild(svgEl('line', {
      x1: cx, y1: midY,
      x2: cx, y2: cy - half,
      class: 'tree-connector',
      ...colorAttrs(color),
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
      ...colorAttrs(parentColor),
    }));

    // Vertical down to each child — colored by child's own status only
    for (const [cx, cy, color] of childPositions) {
      g.appendChild(svgEl('line', {
        x1: cx, y1: midY,
        x2: cx, y2: cy - half,
        class: 'tree-connector',
        ...colorAttrs(color),
      }));
    }
  }

  return g;
}
