import { h } from '../utils/dom.js';
import './StartScreen.scss';

/* Decorative illustrations (DS-PERSONICON style). Static constants → safe to
   inject. Placeholder approximations of the Figma brand art (export the real
   SVGs for production — see DS-ASSET). Both are aria-hidden. */

// Mobile (single-column): compact 2-adult / 2-child family group.
const FAMILY_SVG = `
<svg viewBox="0 0 104 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <g stroke="#343e59" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    <circle cx="26" cy="13" r="9" fill="#f6f6f6"/>
    <path d="M11 47c0-9 6.7-16 15-16s15 7 15 16v3H11z" fill="#f6f6f6"/>
    <circle cx="62" cy="13" r="9" fill="#f6f6f6"/>
    <path d="M47 47c0-9 6.7-16 15-16s15 7 15 16v3H47z" fill="#f6f6f6"/>
    <circle cx="38" cy="34" r="7" fill="#c9e87c"/>
    <path d="M26 64c0-7 5.4-13 12-13s12 6 12 13v4H26z" fill="#c9e87c"/>
    <circle cx="68" cy="34" r="7" fill="#c9e87c"/>
    <path d="M56 64c0-7 5.4-13 12-13s12 6 12 13v4H56z" fill="#c9e87c"/>
  </g>
</svg>`;

// Desktop (two-column): a small sample inheritance pedigree.
const LIME = '#c9e87c';
const SNOW = '#f6f6f6';
const person = (x, y, fill) =>
  `<g transform="translate(${x} ${y})">
     <circle cx="0" cy="9" r="9" fill="${fill}"/>
     <path d="M-15 47c0-9 6.7-16 15-16s15 7 15 16v3H-15z" fill="${fill}"/>
   </g>`;
const SAMPLE_TREE_SVG = `
<svg viewBox="0 0 300 250" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <g stroke="#343e59" stroke-width="2" fill="none" stroke-linecap="round">
    <path d="M150 50 V70 M70 70 H230 M70 70 V90 M230 70 V90"/>
    <path d="M70 140 V160 M40 160 H100 M40 160 V180 M100 160 V180"/>
    <path d="M230 140 V160 M200 160 H260 M200 160 V180 M260 160 V180"/>
  </g>
  <g stroke="#343e59" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    ${person(150, 0, LIME)}
    ${person(70, 90, LIME)}
    ${person(230, 90, SNOW)}
    ${person(40, 180, LIME)}
    ${person(100, 180, SNOW)}
    ${person(200, 180, SNOW)}
    ${person(260, 180, LIME)}
  </g>
</svg>`;

const CONSENT_TEXT =
  'By entering information into this tool, you consent to your responses being used to ' +
  'generate your family tree. This information is used for this one-time purpose only and ' +
  'will not be stored, shared, or used for marketing purposes. This tool is for ' +
  'informational purposes only and does not suggest or confirm X-linked hypophosphatemia ' +
  '(XLH) or any other medical condition. For medical advice, diagnosis, or treatment, ' +
  'please consult a qualified healthcare professional.';

/**
 * Start screen (Figma 0.0 / UI-0). Responsive: single-column (mobile) →
 * two-column (≥768px). Factory → returns destroy() (R2).
 * @param {HTMLElement} mount
 * @param {{ onStart?: () => void }} [opts]
 */
export function createStartScreen(mount, { onStart } = {}) {
  const titleId = 'start-title';

  const visual = h('div', { className: 'start__visual' });
  // mobile illustration + desktop sample tree; CSS shows one per breakpoint
  visual.innerHTML =
    `<div class="start__icon">${FAMILY_SVG}</div>` +
    `<div class="start__tree">${SAMPLE_TREE_SVG}</div>`;

  const startBtn = h(
    'button',
    { className: 'ds-btn ds-btn--cta start__cta', type: 'button' },
    'Start building'
  );
  const onClick = () => onStart?.();
  startBtn.addEventListener('click', onClick);

  const content = h('div', { className: 'start__content' }, [
    h('h1', { id: titleId, className: 'ds-h2 start__title' }, [
      h('span', { className: 'start__title-accent' }, 'XLH'),
      ' Family Tree',
    ]),
    h('p', { className: 'ds-subhead start__lead' },
      'In a series of steps, see how XLH may be inherited in your family.'),
    h('p', { className: 'ds-body start__note' },
      '(This tool takes about 10 minutes to complete.)'),
    startBtn,
    h('p', { className: 'ds-footnote start__disclaimer' },
      'This family tree was created using your responses. It may not reflect your full ' +
      'family history and does not confirm an XLH diagnosis for anyone in your family. This ' +
      'resource is for educational purposes only and does not constitute medical advice. For ' +
      'medical advice or diagnosis, please consult a healthcare professional.'),
  ]);

  const card = h('div', { className: 'ds-card start__card' }, [
    h('div', { className: 'start__main' }, [visual, content]),
    h('p', { className: 'ds-footnote start__consent' }, CONSENT_TEXT),
  ]);

  const root = h('main', { className: 'start', 'aria-labelledby': titleId }, [card]);
  mount.append(root);

  return function destroy() {
    startBtn.removeEventListener('click', onClick);
    root.remove();
  };
}
