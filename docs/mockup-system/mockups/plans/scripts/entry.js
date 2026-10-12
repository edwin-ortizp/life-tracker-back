import icons from './icons.json';
import {startMockup} from '@mockup-system/runtime/bootstrap.js';
import {mountLifeShell} from '@project/project-assets/life-shell.js';
import {mountLogSort} from '@project/project-assets/log-sort.js';
startMockup({'plans-index': context => { mountLifeShell(context); mountLogSort(context, 'plans'); }, 'plans-show': mountLifeShell, 'plans-settings': context => {
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
