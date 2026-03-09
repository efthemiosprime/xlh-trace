import { h } from '../../utils/dom.js';
import { SEX, XLH_STATUS } from '../../data/constants.js';

let formCounter = 0;

export function PersonForm({ name = '', sex = '', xlhStatus = '', sexLocked = false, nameLabel = 'Name' } = {}) {
  const uid = `pf-${++formCounter}`;
  const form = h('div', { className: 'person-form' });

  const nameGroup = h('div', { className: 'form-group' }, [
    h('label', { htmlFor: `${uid}-name` }, nameLabel),
    h('input', { type: 'text', id: `${uid}-name`, className: 'form-input', placeholder: 'Enter name', value: name }),
  ]);

  const sexGroup = h('div', { className: 'form-group' }, [
    h('label', {}, 'Sex'),
    h('div', { className: 'radio-group' }, [
      createRadio(`${uid}-sex`, SEX.MALE, 'Male', sex === SEX.MALE, sexLocked && sex !== SEX.MALE),
      createRadio(`${uid}-sex`, SEX.FEMALE, 'Female', sex === SEX.FEMALE, sexLocked && sex !== SEX.FEMALE),
    ]),
  ]);

  const statusGroup = h('div', { className: 'form-group' }, [
    h('label', {}, 'XLH Status'),
    h('div', { className: 'status-radio-group' }, [
      createStatusRadio(`${uid}-status`, XLH_STATUS.AFFECTED, 'Affected', xlhStatus === XLH_STATUS.AFFECTED),
      createStatusRadio(`${uid}-status`, XLH_STATUS.UNAFFECTED, 'Unaffected', xlhStatus === XLH_STATUS.UNAFFECTED),
      createStatusRadio(`${uid}-status`, XLH_STATUS.UNKNOWN, 'Unknown', xlhStatus === XLH_STATUS.UNKNOWN),
    ]),
  ]);

  form.append(nameGroup, sexGroup, statusGroup);

  form.getValues = () => {
    const nameInput = form.querySelector(`#${uid}-name`);
    const sexInput = form.querySelector(`input[name="${uid}-sex"]:checked`);
    const statusInput = form.querySelector(`input[name="${uid}-status"]:checked`);
    return {
      name: nameInput?.value?.trim() || '',
      sex: sexInput?.value || '',
      xlhStatus: statusInput?.value || '',
    };
  };

  form.isValid = () => {
    const v = form.getValues();
    return v.name.length > 0 && v.sex && v.xlhStatus;
  };

  return form;
}

function createRadio(name, value, label, checked, disabled = false) {
  const input = document.createElement('input');
  input.type = 'radio';
  input.name = name;
  input.value = value;
  if (checked) input.checked = true;
  if (disabled) input.disabled = true;

  const wrapper = h('label', { className: 'radio-option' }, [input, label]);
  return wrapper;
}

function createStatusRadio(name, value, label, checked) {
  const input = document.createElement('input');
  input.type = 'radio';
  input.name = name;
  input.value = value;
  if (checked) input.checked = true;

  const wrapper = h('label', { className: 'status-radio', dataset: { status: value } }, [
    input,
    h('span', { className: 'status-label' }, label),
  ]);
  return wrapper;
}
