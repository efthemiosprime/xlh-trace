import { h } from '../../utils/dom.js';

const ITEMS = [
  { color: '#E53E3E', label: 'Affected (XLH)' },
  { color: '#3182CE', label: 'Unaffected' },
  { color: '#A0AEC0', label: 'Unknown' },
  { color: '#ED64A6', label: 'Carrier (probable)' },
  { color: '#ECC94B', label: 'Carrier (possible)' },
  { color: '#DD6B20', label: 'Spontaneous mutation' },
];

export function TreeLegend() {
  return h('div', { className: 'tree-legend' }, [
    ...ITEMS.map(item =>
      h('div', { className: 'legend-item' }, [
        h('div', { className: 'legend-swatch', style: `background: ${item.color}` }),
        item.label,
      ])
    ),
    h('div', { className: 'legend-item' }, [
      h('div', { className: 'legend-swatch', style: 'background: white; border: 2px solid #718096; border-radius: 50%; width: 14px; height: 14px;' }),
      'Female',
    ]),
    h('div', { className: 'legend-item' }, [
      h('div', { className: 'legend-swatch', style: 'background: white; border: 2px solid #718096; border-radius: 2px;' }),
      'Male',
    ]),
    h('div', { className: 'legend-item' }, [
      h('div', { className: 'legend-swatch', style: 'background: white; border: 2px dashed #2D3748; border-radius: 2px;' }),
      'Proband (tracing for)',
    ]),
  ]);
}
