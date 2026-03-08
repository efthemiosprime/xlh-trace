import { h, clearElement } from '../utils/dom.js';
import { STEPS } from '../data/constants.js';

export function ProgressBar(currentStep) {
  const bar = h('div', { className: 'progress-bar' });

  function render(step) {
    clearElement(bar);
    STEPS.forEach((s, i) => {
      if (i > 0) {
        bar.appendChild(h('div', {
          className: `progress-line${i < step ? ' filled' : ''}`,
        }));
      }

      let cls = 'progress-step';
      if (s.id < step) cls += ' complete';
      else if (s.id === step) cls += ' current';

      bar.appendChild(h('div', { className: cls }, [
        h('div', { className: 'progress-dot' }),
        h('div', { className: 'progress-label' }, s.label),
      ]));
    });
  }

  render(currentStep);
  bar.update = render;
  return bar;
}
