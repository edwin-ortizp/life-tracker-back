import {startMockup} from '@mockup-system/runtime/bootstrap.js';
import {mountLifeShell} from '@project/project-assets/life-shell.js';
function mountMeals(context) {
  mountLifeShell(context);
  const {root, scope} = context;
  const purchase = context.params.get('purchase') || '1';
  root.querySelectorAll('[data-purchase]').forEach(node => { node.hidden = node.dataset.purchase !== purchase; });
  const ingredient = context.params.get('ingredient');
  if (ingredient) {
    const row = [...root.querySelectorAll('[data-ingredient]')].find(node => node.dataset.ingredient === ingredient);
    if (row) {
      row.classList.add('is-ingredient-selected');
      row.setAttribute('tabindex', '-1');
      requestAnimationFrame(() => { row.scrollIntoView({block:'center'}); row.focus({preventScroll:true}); });
    }
  }
  mountMealComposer(root, scope);
  let cookFilter = 'ready';
  const filterCooking = () => {
    const query = (root.querySelector('[data-cook-search]')?.value || '').trim().toLocaleLowerCase('es');
    let visible = 0;
    root.querySelectorAll('[data-cook-card]').forEach(card => {
      card.hidden = (cookFilter !== 'all' && card.dataset.cookState !== cookFilter) || !card.dataset.cookName.toLocaleLowerCase('es').includes(query);
      if (!card.hidden) visible++;
    });
    const empty = root.querySelector('[data-cook-empty]');
    if (empty) empty.hidden = visible > 0;
  };
  scope.on(root, 'input', event => { if (event.target.matches('[data-cook-search]')) filterCooking(); });
  scope.on(root, 'click', event => {
    const button = event.target.closest('[data-cook-filter]');
    if (!button) return;
    cookFilter = button.dataset.cookFilter;
    root.querySelectorAll('[data-cook-filter]').forEach(item => {
      const active = item === button;
      item.setAttribute('aria-pressed', String(active));
      item.classList.toggle('lt-button--tonal', active);
      item.classList.toggle('lt-button--text', !active);
    });
    filterCooking();
  });
  let opener = null;
  scope.on(root, 'click', event => {
    const trigger = event.target.closest('[data-lt-toggle]');
    if (!trigger) return;
    const layer = root.querySelector('#' + trigger.dataset.ltToggle);
    if (!layer?.classList.contains('lt-dialog-layer')) return;
    if (!layer.hidden) { opener = trigger; layer.querySelector('input, select, .lt-dialog__head button')?.focus(); }
    else opener?.focus();
  });
  scope.on(window, 'keydown', event => {
    const layer = root.querySelector('.lt-dialog-layer:not([hidden])');
    if (event.key === 'Escape') { opener?.focus(); return; }
    if (!layer || event.key !== 'Tab') return;
    const items = [...layer.querySelectorAll('button, input, select, textarea, a[href]')].filter(el => el.tabIndex >= 0 && el.getClientRects().length);
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  scope.on(root, 'click', event => {
    const button = event.target.closest('[data-meal-section]');
    if (!button) return;
    root.querySelectorAll('[data-meal-section]').forEach(item => item === button ? item.setAttribute('aria-current', 'page') : item.removeAttribute('aria-current'));
    root.querySelectorAll('[data-meal-panel]').forEach(panel => { panel.hidden = panel.dataset.mealPanel !== button.dataset.mealSection; });
  });
}
startMockup({'meals-weekly': mountMeals, 'meals-recipes': mountMeals, 'meals-ingredients': mountMeals, 'meals-shopping': mountMeals, 'meals-history': mountMeals, 'meals-settings': mountMeals, 'meals-purchase': mountMeals, 'meals-cook': mountMeals});

function mountMealComposer(root, scope) {
  const layer = root.querySelector('#meal-composition');
  if (!layer) return;
  const find = selector => layer.querySelector(selector);
  const catalogs = {
    recipe: ['Avena con banano', 'Pollo al curry', 'Ensalada César', 'Huevos pericos', 'Crema de ahuyama', 'Lentejas con arroz', 'Tacos de pescado', 'Arepa con queso', 'Yogur con granola', 'Salmón al horno', 'Pizza casera', 'Calentado', 'Pancakes de avena', 'Ajiaco'],
    ingredient: ['Avena', 'Banano', 'Leche', 'Huevos', 'Arroz', 'Pollo', 'Tomate', 'Queso']
  };
  // Fixture values per portion (recipes) or per 100 g/ml (ingredients).
  const nutrients = {recipe: [350, 18, 42, 12], ingredient: [100, 4, 16, 2]};
  const saved = new Map();
  let active, draft;
  const list = find('[data-meal-items]');
  const readItems = () => [...list.children].map(row => ({
    kind: row.querySelector('[data-meal-kind]').value,
    name: row.querySelector(row.querySelector('[data-meal-kind]').value === 'free' ? '[data-meal-free]' : '[data-meal-choice]').value.trim(),
    quantity: row.querySelector('[data-meal-quantity]').value,
    unit: row.querySelector('[data-meal-unit]').value
  }));
  function syncKind(row, item = {}) {
    const kind = row.querySelector('[data-meal-kind]').value;
    const free = kind === 'free';
    const choice = row.querySelector('[data-meal-choice]');
    const input = row.querySelector('[data-meal-free]');
    choice.hidden = free; choice.disabled = free || !kind;
    input.hidden = !free; input.disabled = !free; input.value = free ? item.name || '' : '';
    row.querySelector('[data-meal-name-field] span').textContent = {recipe:'Receta', ingredient:'Ingrediente', free:'Nombre'}[kind] || 'Elemento';
    choice.replaceChildren(new Option(kind ? 'Seleccionar' : 'Selecciona el tipo', ''), ...(catalogs[kind] || []).map(name => new Option(name, name)));
    choice.value = item.name || '';
    const units = kind === 'recipe' ? ['porción'] : kind === 'ingredient' ? ['g','ml'] : ['porción','g','ml','unidad'];
    const unit = row.querySelector('[data-meal-unit]');
    unit.replaceChildren(new Option('Seleccionar',''), ...units.map(value => new Option(value,value)));
    unit.value = item.unit || '';
  }
  function appendRow(item = {}) {
    const row = find('[data-meal-row-template]').content.firstElementChild.cloneNode(true);
    row.querySelector('[data-meal-kind]').value = item.kind || '';
    row.querySelector('[data-meal-quantity]').value = item.quantity || '';
    syncKind(row, item); list.append(row);
    return row;
  }
  function render() {
    list.replaceChildren();
    draft.items.forEach(appendRow);
    if (!draft.items.length) appendRow();
    renderNutrition();
  }
  function renderNutrition() {
    draft.items = readItems();
    const total = [0,0,0,0];
    draft.items.filter(item => nutrients[item.kind] && item.name && item.unit && Number(item.quantity) > 0).forEach(item => {
      const factor = item.quantity / (item.kind === 'ingredient' ? 100 : 1);
      nutrients[item.kind].forEach((value, index) => { total[index] += value * factor; });
    });
    find('[data-meal-nutrition]').replaceChildren(...['Energía','Proteínas','Carbohidratos','Grasas'].map((label, index) => {
      const card = document.createElement('div'); card.className = 'lt-metric';
      const name = document.createElement('span'); name.textContent = label;
      const override = find('[data-meal-calories-override]');
      const calories = override.value !== '' && override.checkValidity() ? Number(override.value) : total[0];
      const value = document.createElement('strong'); value.textContent = Math.round(index ? total[index] : calories) + (index ? ' g' : ' kcal'); card.append(name,value); return card;
    }));
    find('[data-meal-nutrition-note]').textContent = 'Valores ilustrativos del mockup; no corresponden a cálculos reales de cada alimento. Los elementos libres no aportan valores nutricionales.';
  }
  const status = find('[data-meal-status]');
  const syncStatus = () => {
    find('[data-meal-outside]').hidden = status.value !== 'outside';
    status.textContent = {planned:'Planeada', home:'Consumida', outside:'Comida por fuera'}[status.value];
  };
  scope.on(find('[data-meal-calories-override]'), 'input', renderNutrition);
  scope.on(list, 'change', event => {
    if (event.target.matches('[data-meal-kind]')) syncKind(event.target.closest('.lt-meal-composer'));
    renderNutrition();
  });
  scope.on(list, 'input', renderNutrition);
  scope.on(root, 'click', event => {
    const stateAction = event.target.closest('[data-meal-set-status]');
    if (stateAction) {
      status.value = stateAction.dataset.mealSetStatus;
      syncStatus();
      find('#meal-status-menu').hidden = true;
      layer.querySelectorAll('[data-lt-toggle="meal-status-menu"]').forEach(button => button.setAttribute('aria-expanded', 'false'));
      find('[data-meal-status-message]').textContent = {planned:'Comida pendiente de consumir.', home:'Consumo marcado en este mockup.', outside:'Completa los datos de la comida por fuera.'}[status.value];
      status.focus(); return;
    }
    const format = event.target.closest('[data-meal-markdown]');
    if (format) {
      const input = find('[data-meal-notes]');
      const start = input.selectionStart, end = input.selectionEnd;
      const selected = input.value.slice(start, end);
      const action = format.dataset.mealMarkdown;
      const markers = {bold:'**', italic:'*'};
      let replacement;
      if (markers[action]) replacement = markers[action] + (selected || 'texto') + markers[action];
      else if (action === 'link') replacement = '[' + (selected || 'texto') + '](https://)';
      else replacement = (start > 0 && input.value[start - 1] !== '\n' ? '\n' : '') + (selected || 'Elemento').split('\n').map((line, index) => (action === 'ordered' ? (index + 1) + '. ' : '- ') + line).join('\n');
      input.setRangeText(replacement, start, end, 'select'); input.focus();
      input.dispatchEvent(new Event('input', {bubbles:true}));
      return;
    }
    const slot = event.target.closest('[data-meal-key]');
    if (slot) {
      active = slot;
      draft = structuredClone(saved.get(slot.dataset.mealKey) || {items: slot.dataset.mealRecipe ? [{kind:'recipe', name:slot.dataset.mealRecipe, quantity:1, unit:'porción'}] : [], notes:''});
      find('#meal-composition-title').textContent = slot.dataset.mealLabel;
      find('[data-meal-notes]').value = draft.notes;
      status.value = draft.status === 'consumed' ? draft.consumption_mode || 'home' : 'planned';
      find('[data-meal-outside-notes]').value = draft.outsideNotes || '';
      find('[data-meal-outside-calories]').value = draft.outsideCalories ?? '';
      syncStatus();
      find('[data-meal-status-message]').textContent = '';
      find('[data-meal-calories-override]').value = draft.caloriesOverride ?? '';
      find('[data-meal-error]').textContent = '';
      find('[data-lt-dialog-section="composition"]').click();
      render();
    }
    if (event.target.closest('[data-meal-add]')) {
      appendRow().querySelector('[data-meal-kind]').focus();
      renderNutrition();
    }
    const remove = event.target.closest('[data-meal-remove]');
    if (remove) { remove.closest('.lt-meal-composer').remove(); renderNutrition(); find('[data-meal-add]').focus(); }
    if (event.target.closest('[data-lt-action="save-meal"]') && active) {
      // An outside consumption can exist without a planned composition.
      if (status.value === 'outside') [...list.children].forEach(row => {
        if (![...row.querySelectorAll('input, select')].some(control => control.value)) row.remove();
      });
      const invalid = [...list.querySelectorAll('input, select'), find('[data-meal-calories-override]'), ...(status.value === 'outside' ? [find('[data-meal-outside-calories]')] : [])].find(control => !control.disabled && !control.checkValidity());
      if (invalid) {
        find('[data-lt-dialog-section="' + (invalid.matches('[data-meal-calories-override]') ? 'nutrition' : 'composition') + '"]').click();
        find('[data-meal-error]').textContent = 'Completa el tipo, el elemento, la cantidad y la unidad de cada fila, o quita las filas vacías.';
        invalid.reportValidity(); invalid.focus(); return;
      }
      draft.items = readItems();
      draft.notes = find('[data-meal-notes]').value;
      draft.status = status.value === 'planned' ? 'planned' : 'consumed';
      draft.consumption_mode = status.value === 'planned' ? null : status.value;
      draft.caloriesOverride = find('[data-meal-calories-override]').value;
      draft.outsideNotes = find('[data-meal-outside-notes]').value;
      draft.outsideCalories = find('[data-meal-outside-calories]').value;
      saved.set(active.dataset.mealKey, structuredClone(draft));
      active.querySelector('[data-meal-status-label]').textContent = {planned:'Planeada', home:'Consumida', outside:'Comida por fuera'}[status.value];
      active.querySelector('[data-meal-caption]').textContent = draft.items.map(item => item.name).join(' + ') || (status.value === 'outside' ? 'Comida por fuera' : 'Planificar comida');
      active.classList.toggle('lt-meal-slot--empty', !draft.items.length && draft.status === 'planned');
      layer.hidden = true; active.focus();
    }
  });
}
