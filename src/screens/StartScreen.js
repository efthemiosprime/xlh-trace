import { h } from '../utils/dom.js';
import './StartScreen.scss';

/* Brand illustrations exported from Figma (public/images). Decorative → alt="".
   mobile = simple family icon; desktop = sample inheritance pedigree. */
const ICON_MOBILE = '/images/family-tree-icon.svg';
const TREE_DESKTOP = '/images/full-tree.svg';

const CONSENT_TEXT =
  'By entering information into this tool, you consent to your responses being used to ' +
  'generate your family tree. This information is used for this one-time purpose only and ' +
  'will not be stored, shared, or used for marketing purposes. This tool is for ' +
  'informational purposes only and does not suggest or confirm X-linked hypophosphatemia ' +
  '(XLH) or any other medical condition. For medical advice, diagnosis, or treatment, ' +
  'please consult a qualified healthcare professional.';

/**
 * Start screen (Figma 0.0 / UI-0). Responsive: single-column (mobile) →
 * two-column (≥768px); the card fills the viewport (capped at the 1440 design
 * width). Factory → returns destroy() (R2).
 * @param {HTMLElement} mount
 * @param {{ onStart?: () => void }} [opts]
 */
export function createStartScreen(mount, { onStart } = {}) {
  const titleId = 'start-title';

  const visual = h('div', { className: 'start__visual' }, [
    h('img', { className: 'start__icon', src: ICON_MOBILE, alt: '' }),
    h('img', { className: 'start__tree', src: TREE_DESKTOP, alt: '' }),
  ]);

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

  const card = h('div', { className: 'app-shell' }, [
    h('div', { className: 'start__main' }, [visual, content]),
    h('p', { className: 'ds-footnote start__consent' }, CONSENT_TEXT),
  ]);

  const root = h('main', { className: 'page start', 'aria-labelledby': titleId }, [card]);
  mount.append(root);

  return function destroy() {
    startBtn.removeEventListener('click', onClick);
    root.remove();
  };
}
