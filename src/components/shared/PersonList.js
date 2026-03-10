import { h, clearElement } from '../../utils/dom.js';
import { PersonCard } from './PersonCard.js';

export function PersonList({ people = [], emptyText = 'No one added yet.', onAdd, onEdit, onRemove, onSave, addLabel = '+ Add Person' }) {
  const container = h('div', { className: 'person-list' });

  function render() {
    clearElement(container);

    if (people.length === 0) {
      container.appendChild(h('div', { className: 'person-list-empty' }, emptyText));
    } else {
      for (const person of people) {
        container.appendChild(PersonCard(person, {
          onEdit: onEdit || undefined,
          onRemove,
          onSave: onSave || undefined,
        }));
      }
    }

    if (onAdd) {
      container.appendChild(
        h('button', { className: 'add-person-btn', onClick: onAdd }, addLabel)
      );
    }
  }

  render();

  container.update = (newPeople) => {
    people = newPeople;
    render();
  };

  return container;
}
