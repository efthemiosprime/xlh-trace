import { h } from '../../utils/dom.js';
import { SEX, XLH_STATUS } from '../../data/constants.js';

export function PersonForm({ name = '', sex = '', xlhStatus = '', sexLocked = false, nameLabel = 'Name' } = {}) {
  const form = h('div', { className: 'person-form' });

  const nameGroup = h('div', { className: 'form-group' }, [
    h('label', { htmlFor: 'pf-name' }, nameLabel),
    h('input', { type: 'text', id: 'pf-name', className: 'form-input', placeholder: 'Enter name', value: name }),
  ]);

  const sexGroup = h('div', { className: 'form-group' }, [
    h('label', {}, 'Sex'),
    h('div', { className: 'radio-group' }, [
      createRadio('sex', SEX.MALE, 'Male', sex === SEX.MALE, sexLocked),
      createRadio('sex', SEX.FEMALE, 'Female', sex === SEX.FEMALE, sexLocked),
    ]),
  ]);

  const statusGroup = h('div', { className: 'form-group' }, [
    h('label', {}, 'XLH Status'),
    h('div', { className: 'status-radio-group' }, [
      createStatusRadio('xlhStatus', XLH_STATUS.AFFECTED, 'Affected', xlhStatus === XLH_STATUS.AFFECTED),
      createStatusRadio('xlhStatus', XLH_STATUS.UNAFFECTED, 'Unaffected', xlhStatus === XLH_STATUS.UNAFFECTED),
      createStatusRadio('xlhStatus', XLH_STATUS.UNKNOWN, 'Unknown', xlhStatus === XLH_STATUS.UNKNOWN),
    ]),
  ]);

  form.append(nameGroup, sexGroup, statusGroup);

  form.getValues = () => {
    const nameInput = form.querySelector('#pf-name');
    const sexInput = form.querySelector('input[name="sex"]:checked');
    const statusInput = form.querySelector('input[name="xlhStatus"]:checked');
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
  const wrapper = h('label', { className: 'radio-option' }, [
    h('input', {
      type: 'radio',
      name,
      value,
      ...(checked ? { checked: '' } : {}),
      ...(disabled ? { disabled: '' } : {}),
    }),
    label,
  ]);
  return wrapper;
}

function createStatusRadio(name, value, label, checked) {
  const wrapper = h('label', { className: 'status-radio', dataset: { status: value } }, [
    h('input', {
      type: 'radio',
      name,
      value,
      ...(checked ? { checked: '' } : {}),
    }),
    h('span', { className: 'status-label' }, label),
  ]);
  return wrapper;
}
