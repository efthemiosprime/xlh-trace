import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';

const LEGEND_ITEMS = [
  { color: '#E53E3E', label: 'Affected (XLH)', shape: 'rect' },
  { color: '#3182CE', label: 'Unaffected', shape: 'rect' },
  { color: '#A0AEC0', label: 'Unknown', shape: 'rect' },
  { color: '#ED64A6', label: 'Carrier (probable)', shape: 'rect' },
  { color: '#ECC94B', label: 'Carrier (possible)', shape: 'rect' },
  { color: '#DD6B20', label: 'Spontaneous mutation', shape: 'rect' },
];

const SHAPE_ITEMS = [
  { label: 'Female', shape: 'circle', border: '#718096' },
  { label: 'Male', shape: 'square', border: '#718096' },
  { label: 'Proband (tracing for)', shape: 'square', border: '#2D3748', dashed: true },
];

const MARGIN_MM = 15;
const MIN_READABLE_TEXT_PX = 5;

/**
 * Build an SVG <g> element representing the legend.
 */
function buildLegendSVG(startY) {
  const ns = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(ns, 'g');
  g.setAttribute('transform', `translate(20, ${startY})`);

  let x = 0;
  const y = 0;
  const swatchSize = 14;
  const gap = 8;

  const allItems = [
    ...LEGEND_ITEMS.map(i => ({ ...i, type: 'color' })),
    ...SHAPE_ITEMS.map(i => ({ ...i, type: 'shape' })),
  ];

  for (const item of allItems) {
    // Swatch
    if (item.type === 'color') {
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', swatchSize);
      rect.setAttribute('height', swatchSize);
      rect.setAttribute('rx', 2);
      rect.setAttribute('fill', item.color);
      g.appendChild(rect);
    } else if (item.shape === 'circle') {
      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('cx', x + swatchSize / 2);
      circle.setAttribute('cy', y + swatchSize / 2);
      circle.setAttribute('r', swatchSize / 2);
      circle.setAttribute('fill', 'white');
      circle.setAttribute('stroke', item.border);
      circle.setAttribute('stroke-width', '2');
      g.appendChild(circle);
    } else {
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', swatchSize);
      rect.setAttribute('height', swatchSize);
      rect.setAttribute('rx', 2);
      rect.setAttribute('fill', 'white');
      rect.setAttribute('stroke', item.border);
      rect.setAttribute('stroke-width', '2');
      if (item.dashed) rect.setAttribute('stroke-dasharray', '4 2');
      g.appendChild(rect);
    }

    // Label
    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', x + swatchSize + 4);
    text.setAttribute('y', y + swatchSize - 3);
    text.setAttribute('font-size', '10');
    text.setAttribute('font-family', 'Inter, system-ui, sans-serif');
    text.setAttribute('fill', '#1a202c');
    text.textContent = item.label;
    g.appendChild(text);

    x += swatchSize + 4 + item.label.length * 6.5 + gap;
  }

  return g;
}

/**
 * Clone the tree SVG and inline all computed styles so it's self-contained.
 */
function prepareExportSVG(svgElement) {
  const clone = svgElement.cloneNode(true);

  // Remove action button groups (hover UI)
  for (const el of clone.querySelectorAll('.action-group')) el.remove();

  // Inline font styles on all text elements
  const textEls = clone.querySelectorAll('text, tspan');
  for (const el of textEls) {
    if (!el.getAttribute('font-family')) {
      el.setAttribute('font-family', 'Inter, system-ui, sans-serif');
    }
  }

  // Ensure line/rect/circle strokes are explicit (they already are from TreeNode.js)
  return clone;
}

/**
 * Export the tree SVG to a PDF file and trigger download.
 * @param {SVGElement} svgElement - The rendered tree SVG from TreeRenderer
 * @returns {Promise<void>}
 */
async function buildTreePDF(svgElement) {
  // Prepare a self-contained SVG clone
  const svg = prepareExportSVG(svgElement);

  // Get tree dimensions from viewBox or width/height attributes
  const vb = svg.getAttribute('viewBox');
  let svgW, svgH;
  if (vb) {
    const parts = vb.split(/[\s,]+/).map(Number);
    svgW = parts[2];
    svgH = parts[3];
  } else {
    svgW = parseFloat(svg.getAttribute('width')) || 800;
    svgH = parseFloat(svg.getAttribute('height')) || 600;
  }

  // Add legend below the tree
  const legendPadding = 20;
  const legendHeight = 24;
  const totalH = svgH + legendPadding + legendHeight;
  const legendGroup = buildLegendSVG(svgH + legendPadding);
  svg.appendChild(legendGroup);

  // Update viewBox to include legend
  svg.setAttribute('viewBox', `0 0 ${svgW} ${totalH}`);
  svg.setAttribute('width', svgW);
  svg.setAttribute('height', totalH);

  // Determine orientation
  const isLandscape = svgW > totalH;
  const orientation = isLandscape ? 'landscape' : 'portrait';

  // A4 page dimensions in mm
  const pageW = isLandscape ? 297 : 210;
  const pageH = isLandscape ? 210 : 297;

  const usableW = pageW - MARGIN_MM * 2;
  const usableH = pageH - MARGIN_MM * 2;

  // Convert usable area to px (at 96 dpi: 1mm ≈ 3.7795px)
  const pxPerMm = 96 / 25.4;
  const usableWpx = usableW * pxPerMm;
  const usableHpx = usableH * pxPerMm;

  // Scale factor to fit
  const scale = Math.min(usableWpx / svgW, usableHpx / totalH);

  // Check if text would be readable
  const effectiveTextSize = 11 * scale; // base font is 11px
  if (effectiveTextSize < MIN_READABLE_TEXT_PX) {
    const proceed = confirm(
      `Warning: Your family tree is quite large. Text may be difficult to read in the exported PDF ` +
      `(effective text size: ${effectiveTextSize.toFixed(1)}px).\n\nProceed anyway?`
    );
    if (!proceed) return;
  }

  // Create PDF
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  // Center the SVG on the page
  const renderedW = svgW * scale / pxPerMm;
  const renderedH = totalH * scale / pxPerMm;
  const offsetX = MARGIN_MM + (usableW - renderedW) / 2;
  const offsetY = MARGIN_MM + (usableH - renderedH) / 2;

  // Temporarily attach clone to document so svg2pdf can measure it
  svg.style.position = 'absolute';
  svg.style.left = '-9999px';
  document.body.appendChild(svg);

  try {
    await svg2pdf(svg, pdf, {
      x: offsetX,
      y: offsetY,
      width: renderedW,
      height: renderedH,
    });

    return pdf;
  } finally {
    document.body.removeChild(svg);
  }
}

/**
 * Generate the tree PDF and return it as a Blob.
 * @param {SVGElement} svgElement
 * @returns {Promise<Blob>}
 */
export async function generateTreePDFBlob(svgElement) {
  const pdf = await buildTreePDF(svgElement);
  if (!pdf) return null;
  return pdf.output('blob');
}

/**
 * Export the tree SVG to a PDF file and trigger download.
 * @param {SVGElement} svgElement
 * @returns {Promise<void>}
 */
export async function exportTreePDF(svgElement) {
  const pdf = await buildTreePDF(svgElement);
  if (!pdf) return;
  pdf.save('xlh-family-tree.pdf');
}
