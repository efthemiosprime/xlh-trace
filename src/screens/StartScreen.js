import { h } from '../utils/dom.js';
import './StartScreen.scss';

/* Decorative family illustration (DS-PERSONICON style: steel-outline adults,
   lime children). Static constant → safe to inject. Placeholder approximation
   of the Figma brand asset (export the real SVG for production — see DS-ASSET). */
const FAMILY_SVG = `
<svg viewBox="0 0 104 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <g stroke="#343e59" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    <!-- adult left -->
    <circle cx="26" cy="13" r="9" fill="#f6f6f6"/>
    <path d="M11 47c0-9 6.7-16 15-16s15 7 15 16v3H11z" fill="#f6f6f6"/>
    <!-- adult right -->
    <circle cx="62" cy="13" r="9" fill="#f6f6f6"/>
    <path d="M47 47c0-9 6.7-16 15-16s15 7 15 16v3H47z" fill="#f6f6f6"/>
    <!-- child left (lime) -->
    <circle cx="38" cy="34" r="7" fill="#c9e87c"/>
    <path d="M26 64c0-7 5.4-13 12-13s12 6 12 13v4H26z" fill="#c9e87c"/>
    <!-- child right (lime) -->
    <circle cx="68" cy="34" r="7" fill="#c9e87c"/>
    <path d="M56 64c0-7 5.4-13 12-13s12 6 12 13v4H56z" fill="#c9e87c"/>
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
 * Start screen (Figma 0.0 / UI-0). Factory → returns destroy() (R2).
 * @param {HTMLElement} mount
 * @param {{ onStart?: () => void }} [opts]
 */
export function createStartScreen(mount, { onStart } = {}) {
  const titleId = 'start-title';

  const icon = h('div', { className: 'start__icon' });
  icon.innerHTML = FAMILY_SVG; // static constant, no user data

  const startBtn = h(
    'button',
    { className: 'ds-btn ds-btn--cta start__cta', type: 'button' },
    'Start building'
  );

  const onClick = () => onStart?.();
  startBtn.addEventListener('click', onClick);

  const card = h('div', { className: 'ds-card start__card' }, [
    icon,
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
    h('p', { className: 'ds-footnote start__consent' }, CONSENT_TEXT),
  ]);

  const root = h('main', {
    className: 'start',
    'aria-labelledby': titleId,
  }, [card]);

  mount.append(root);

  return function destroy() {
    startBtn.removeEventListener('click', onClick);
    root.remove();
  };
}
