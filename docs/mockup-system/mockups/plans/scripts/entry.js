import icons from './icons.json';
import {startMockup} from '@mockup-system/runtime/bootstrap.js';
import {mountLifeShell} from '@project/project-assets/life-shell.js';
import {mountLogSort} from '@project/project-assets/log-sort.js';
function mountPlanActivity(context) {
  mountLifeShell(context);
  mountLogSort(context, 'plan-activity');
  const {root, scope} = context;
  function refresh() {
    const query = root.querySelector('.lt-mcard__search input').value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const rows = [...root.querySelectorAll('[data-plan-activity-row]')];
    rows.forEach(row => { row.hidden = !row.querySelector('.lt-list-item__body').textContent.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(query); });
    const count = rows.filter(row => !row.hidden).length;
    root.querySelector('[data-lt-visible-count]').textContent = `(${count} / ${rows.length})`;
    root.querySelector('[data-plan-activity-empty]').hidden = count !== 0;
    root.querySelector('.lt-mcard__range').textContent = count ? `1–${count} de ${count}` : '0 de 0';
  }
  scope.on(root, 'input', event => {
    if (event.target.matches('.lt-mcard__search input')) refresh();
  });
  scope.on(root, 'click', event => {
    const button = event.target.closest('[data-lt-action^="activity-delete-"]');
    if (!button) return;
    const id = button.dataset.ltAction.slice('activity-delete-'.length);
    root.querySelector(`[data-entry-id="${id}"]`)?.remove();
    root.querySelector(`#activity-delete-${id}`).hidden = true;
    refresh();
    context.toast('Visita eliminada del historial de demostración.');
  });
}
startMockup({'plans-contact': context => {
  mountLifeShell(context);
  const {root} = context;
  const people = {'Camila':'Camila Rojas','María':'María Ortiz','Daniel':'Daniel Pérez'};
  const person = context.params.get('person') || '';
  const name = people[person] || 'Contacto no disponible';
  root.querySelector('[data-contact-name]').textContent = name;
  root.querySelector('.lt-topbar__title').textContent = name;
  root.querySelector('[data-contact-initial]').textContent = name[0];
  const template = document.querySelector('template[data-screen="plans-index"]');
  const rows = template ? [...template.content.querySelectorAll('.lt-plan')] : [];
  const matches = rows.filter(row => [...row.querySelectorAll('.lt-plan__person')].some(link => link.textContent.trim().slice(1).trim() === person));
  matches.forEach(row => {
    const link = document.createElement('a'); link.className = 'lt-list-item'; link.href = '#/plans-index';
    link.textContent = row.querySelector('.lt-plan__body strong').textContent;
    root.querySelector('[data-contact-plans]').append(link);
  });
  root.querySelector('[data-contact-empty]').hidden = matches.length > 0;
}, 'plans-scheduled': mountPlanActivity, 'plans-history': mountPlanActivity, 'plans-index': context => { mountLifeShell(context); mountLogSort(context, 'plans'); }, 'plans-show': mountLifeShell, 'plans-settings': context => {
  mountLifeShell(context);
  const {root, scope} = context;
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const aliases = {'corazon':'heart','calendario':'calendar','personas':'people','naturaleza':'tree','categoria':'grid','etiqueta':'tag','comida':'egg','cultura':'bank'};
  function renderIcons(picker) {
    const raw = normalize(picker.querySelector('[data-icon-search]').value.trim());
    const query = aliases[raw] || raw;
    const matches = icons.filter(name => name.includes(query));
    const results = picker.querySelector('[data-icon-results]');
    results.replaceChildren();
    matches.slice(0, 60).forEach(name => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'lt-icon-button';
      button.dataset.iconChoice = 'bi-' + name;
      button.title = name; button.setAttribute('aria-label', name);
      button.setAttribute('aria-pressed', String(picker.querySelector('[data-icon-value]').value === 'bi-' + name));
      const icon = document.createElement('i'); icon.className = 'bi bi-' + name; icon.setAttribute('aria-hidden', 'true');
      button.append(icon); results.append(button);
    });
    picker.querySelector('[data-icon-status]').textContent = matches.length ? `${matches.length} iconos encontrados${matches.length > 60 ? '. Se muestran 60; escribe para afinar la búsqueda.' : '.'}` : 'No se encontraron iconos. Prueba otro nombre.';
  }
  root.querySelectorAll('[data-icon-picker]').forEach(renderIcons);
  scope.on(root, 'input', event => {
    if (event.target.matches('[data-icon-search]')) renderIcons(event.target.closest('[data-icon-picker]'));
  });
  scope.on(root, 'click', event => {
    const button = event.target.closest('[data-icon-choice]');
    if (!button) return;
    const picker = button.closest('[data-icon-picker]');
    const value = button.dataset.iconChoice;
    picker.querySelector('[data-icon-value]').value = value;
    picker.querySelector('[data-icon-preview]').className = 'bi ' + value;
    picker.querySelector('[data-icon-name]').textContent = value;
    picker.querySelectorAll('[data-icon-choice]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  });
  scope.on(root, 'click', event => {
    const button = event.target.closest('[data-plan-section]');
    if (!button) return;
    root.querySelectorAll('[data-plan-section]').forEach(item => item === button ? item.setAttribute('aria-current', 'page') : item.removeAttribute('aria-current'));
    root.querySelectorAll('[data-plan-panel]').forEach(panel => { panel.hidden = panel.dataset.planPanel !== button.dataset.planSection; });
  });
  scope.on(root, 'input', event => {
    if (!event.target.matches('.lt-mcard__search input')) return;
    const card = event.target.closest('.lt-mcard');
    const query = event.target.value.trim().toLocaleLowerCase('es');
    const rows = [...card.querySelectorAll('tbody tr')];
    rows.forEach(row => { row.hidden = !row.cells[0].textContent.toLocaleLowerCase('es').includes(query); });
    card.querySelector('[data-lt-visible-count]').textContent = `(${rows.filter(row => !row.hidden).length} / ${rows.length})`;
  });
}});
