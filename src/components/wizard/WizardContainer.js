import { h, clearElement, $ } from '../../utils/dom.js';
import { StepProband } from './StepProband.js';
import { StepChildren } from './StepChildren.js';
import { StepParents } from './StepParents.js';
import { StepAuntsUncles } from './StepAuntsUncles.js';
import { StepGrandparents } from './StepGrandparents.js';
import { StepTreeView } from './StepTreeView.js';
import { familyStore } from '../../data/FamilyStore.js';

const stepComponents = [null, StepProband, StepChildren, StepParents, StepAuntsUncles, StepGrandparents, StepTreeView];

export function WizardContainer({ onStepChange }) {
  let currentStep = 1;
  let unsubscribe = null;
  const container = h('div', { className: 'wizard-container' });

  function renderStep() {
    // Clean up previous subscription
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }

    clearElement(container);
    const StepComponent = stepComponents[currentStep];
    if (!StepComponent) return;

    const isLastStep = currentStep === 6;
    const stepEl = StepComponent({
      onNext: () => goTo(currentStep + 1),
      onPrev: () => goTo(currentStep - 1),
    });

    container.appendChild(h('div', { className: 'wizard-step' }, [stepEl]));

    if (!isLastStep) {
      const prevBtn = currentStep > 1
        ? h('button', { className: 'btn btn-secondary', onClick: () => goTo(currentStep - 1) }, '\u2190 Back')
        : h('span');

      const nextLabel = currentStep === 5 ? 'View Family Tree \u2192' : 'Next \u2192';
      const nextBtn = h('button', {
        className: 'btn btn-primary',
        onClick: () => {
          if (currentStep === 1 && !familyStore.getProband()) return;
          goTo(currentStep + 1);
        },
      }, nextLabel);

      const nav = h('div', { className: 'wizard-nav' }, [prevBtn, nextBtn]);
      container.appendChild(nav);

      // Only gate step 1 — enable Next once proband exists
      if (currentStep === 1) {
        const updateBtn = () => {
          nextBtn.disabled = !familyStore.getProband();
        };
        updateBtn();
        unsubscribe = familyStore.subscribe(updateBtn);
      }
    }
  }

  function goTo(step) {
    if (step < 1 || step > 6) return;
    if (step > 1 && !familyStore.getProband()) return;
    currentStep = step;
    renderStep();
    if (onStepChange) onStepChange(currentStep);
  }

  renderStep();

  container.goTo = goTo;
  container.getCurrentStep = () => currentStep;

  return container;
}
