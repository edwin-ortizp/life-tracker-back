import {startMockup} from '@mockup-system/runtime/bootstrap.js';
import {mountLifeShell} from '@project/project-assets/life-shell.js';
function mountMeals(context) {
  mountLifeShell(context);
  const {root, scope} = context;
  scope.on(root, 'click', event => {
    if (event.target.closest('[data-lt-action="view-today-recipe"]')) context.navigate('/meals-recipes');
  });
  const purchase = context.params.get('purchase') || '1';
  root.querySelectorAll('[data-purchase]').forEach(node => { node.hidden = node.dataset.purchase !== purchase; });
  const ingredient = context.params.get('ingredient');
  if (ingredient) {
    // Llegar desde un enlace (p. ej. el detalle de compra) se ve como un filtro aplicado que se puede quitar.
    const template = root.querySelector('[data-ingredient-filter-template]');
    const rows = [...root.querySelectorAll('tr[data-ingredient]')];
    if (template && rows.length) {
      const strip = template.content.firstElementChild.cloneNode(true);
      const label = 'Ingrediente: ' + ingredient;
      strip.querySelector('.lt-chip span').textContent = label;
      strip.querySelector('[data-lt-remove-filter]').setAttribute('aria-label', 'Quitar filtro ' + label);
      template.after(strip);
      rows.forEach(row => { row.hidden = row.dataset.ingredient !== ingredient; });
      const badge = root.querySelector('#ingredients [data-lt-filter-count]'); if (badge) { badge.textContent = '1'; badge.hidden = false; }
      const counter = root.querySelector('#ingredients [data-lt-visible-count]'); if (counter) counter.textContent = '(' + rows.filter(row => !row.hidden).length + ' / ' + (counter.dataset.total || rows.length) + ')';
      scope.on(root, 'click', event => {
        if (!event.target.closest('#ingredients [data-lt-remove-filter], #ingredients [data-lt-clear-filters]')) return;
        requestAnimationFrame(() => { if (!strip.querySelector('[data-lt-remove-filter]')) { rows.forEach(row => { row.hidden = false; }); strip.remove(); } });
      });
    }
  }
  mountMealComposer(root, scope);
  mountIngredientEditor(root, scope);
  mountIngredientMerge(root, scope);
  scope.on(root,'click',event=>{
    const trigger=event.target.closest('[data-lt-toggle="recipe-new"]');
    if(!trigger || trigger.closest('#recipe-new')) return;
    const row=trigger.closest('[data-recipe-row]');
    const modal=root.querySelector('#recipe-new');
    modal.querySelector('#recipe-new-title').textContent=row ? 'Editar receta' : 'Crear receta';
    modal.querySelector('[data-section="basic"] input[type="text"]').value=row?.querySelector('strong').textContent || '';
    modal.querySelector('[data-section="basic"] input[type="number"]').value=row?.querySelector('[data-label="Tiempo"]').textContent.replace(/\D/g,'') || '';
  });
  let recipeFilter = 'Todas';
  const filterRecipes = () => {
    const query = (root.querySelector('#meal-recipes-list input[type="search"]')?.value || '').toLocaleLowerCase('es');
    let count = 0;
    root.querySelectorAll('[data-recipe-row]').forEach(row => {
      const tag = {Vegetarianas:'Vegetariana',Rápidas:'Rápida'}[recipeFilter] || recipeFilter;
      row.hidden = !row.dataset.recipeName.toLocaleLowerCase('es').includes(query) || (recipeFilter !== 'Todas' && !row.dataset.recipeTags.includes(tag));
      if(!row.hidden) count++;
    });
    const empty = root.querySelector('[data-recipe-empty]');if(empty) empty.hidden=count>0;
    const counter = root.querySelector('#meal-recipes-list [data-lt-visible-count]');if(counter) counter.textContent='('+count+' / 8)';
  };
  scope.on(root,'input',event=>{if(event.target.matches('#meal-recipes-list input[type="search"]')) filterRecipes();});
  scope.on(root,'click',event=>{
    const filter=event.target.closest('[data-recipe-filter]');if(!filter)return;
    recipeFilter=filter.dataset.recipeFilter;
    root.querySelectorAll('[data-recipe-filter]').forEach(button=>{const active=button===filter;button.setAttribute('aria-pressed',String(active));button.classList.toggle('lt-button--tonal',active);button.classList.toggle('lt-button--text',!active);});
    filterRecipes();
  });
  let cookFilter = 'ready';
  const filterCooking = () => {
    const query = (root.querySelector('#meal-cook-list input[type="search"]')?.value || '').trim().toLocaleLowerCase('es');
    let visible = 0;
    root.querySelectorAll('[data-cook-card]').forEach(card => {
      card.hidden = (cookFilter !== 'all' && card.dataset.cookState !== cookFilter) || !card.dataset.cookName.toLocaleLowerCase('es').includes(query);
      if (!card.hidden) visible++;
    });
    const empty = root.querySelector('[data-cook-empty]');
    if (empty) empty.hidden = visible > 0;
  };
  scope.on(root, 'input', event => { if (event.target.matches('#meal-cook-list input[type="search"]')) filterCooking(); });
  scope.on(root, 'change', event => {
    const input = event.target.closest('[data-cook-filter]');
    if (!input || !input.checked) return;
    cookFilter = input.value;
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
startMockup({'meals-categories': mountLifeShell, 'meals-weekly': mountMeals, 'meals-recipes': mountMeals, 'meals-ingredients': mountMeals, 'meals-shopping': mountMeals, 'meals-history': mountMeals, 'meals-settings': mountMeals, 'meals-purchase': mountMeals, 'meals-cook': mountMeals});

function mountMealComposer(root, scope) {
  const layer = root.querySelector('#meal-composition');
  if (!layer) return;
  const find = selector => layer.querySelector(selector) || root.querySelector(selector);
  const actionLayer = root.querySelector('#meal-action-dialog');
  let selectedAction = null;
  const catalogs = {
    recipe: ['Avena con banano', 'Pollo al curry', 'Ensalada César', 'Huevos pericos', 'Crema de ahuyama', 'Lentejas con arroz', 'Tacos de pescado', 'Arepa con queso', 'Yogur con granola', 'Salmón al horno', 'Pizza casera', 'Calentado', 'Pancakes de avena', 'Ajiaco'],
    ingredient: ['Avena', 'Banano', 'Leche', 'Huevos', 'Arroz', 'Pollo', 'Tomate', 'Queso']
  };
  // Fixture values per portion (recipes) or per 100 g/ml (ingredients).
  const nutrients = {recipe: [350, 18, 42, 12], ingredient: [100, 4, 16, 2]};
  const saved = new Map();
  let active, draft;
  const emptyMeal = () => ({items:[], notes:'', status:'planned'});
  const mealAt = slot => structuredClone(saved.get(slot.dataset.mealKey) || {
    items: slot.dataset.mealRecipe ? [
      {kind:'recipe', name:slot.dataset.mealRecipe, quantity:1, unit:'porción'},
      ...(slot.dataset.mealRecipe === 'Ensalada César' ? [{kind:'ingredient',name:'Tomate',quantity:100,unit:'g'},{kind:'ingredient',name:'Queso',quantity:30,unit:'g'}] : [])
    ] : [], notes:'', status:'planned'
  });
  const mealCalories = meal => {
    if (meal.status === 'consumed' && meal.consumption_mode === 'outside') return meal.outsideCalories === '' || meal.outsideCalories === undefined ? null : Number(meal.outsideCalories);
    if (meal.caloriesOverride !== undefined && meal.caloriesOverride !== '') return Number(meal.caloriesOverride);
    return meal.items.length ? meal.items.reduce((sum,item) => sum + (nutrients[item.kind]?.[0] || 0) * Number(item.quantity) / (item.kind === 'ingredient' ? 100 : 1), 0) : null;
  };
  function renderSlotSummary(slot, meal) {
    const caption = slot.querySelector('[data-meal-caption]');
    caption.replaceChildren(document.createTextNode(meal.items[0]?.name || (meal.consumption_mode === 'outside' ? 'Comida por fuera' : 'Agregar')));
    slot.removeAttribute('aria-describedby');
    if (meal.items.length > 1) {
      const extra = meal.items.slice(1).map(item => item.name);
      const more = document.createElement('span');
      more.className = 'lt-meal-more'; more.textContent = ` +${extra.length}`;
      more.title = extra.join(' · ');
      const tooltip = document.createElement('span');
      tooltip.id = `meal-extras-${slot.dataset.mealKey}`;
      tooltip.className = 'lt-meal-tooltip'; tooltip.setAttribute('role','tooltip'); tooltip.textContent = extra.join(' · ');
      more.append(tooltip); caption.append(more);
      slot.setAttribute('aria-describedby',tooltip.id);
    }
    const calories = slot.querySelector('[data-meal-calories]');
    const value = mealCalories(meal);
    calories.hidden = value === null;
    calories.textContent = value === null ? '' : `${Math.round(value).toLocaleString('es-CO')} kcal`;
  }

  function updateWeekTotals() {
    const days = new Map();
    root.querySelectorAll('[data-meal-key]').forEach(slot => {
      const meal = mealAt(slot), day = slot.dataset.mealKey.split('-')[0];
      const totals = days.get(day) || {planned:0, consumed:0};
      const calculated = meal.items.reduce((sum,item) => sum + (nutrients[item.kind]?.[0] || 0) * Number(item.quantity) / (item.kind === 'ingredient' ? 100 : 1), 0);
      const override = meal.caloriesOverride;
      const calories = override !== undefined && override !== '' ? Number(override) : calculated;
      if (meal.status === 'consumed') totals.consumed += meal.consumption_mode === 'outside' ? Number(meal.outsideCalories || 0) : calories;
      else totals.planned += calories;
      days.set(day, totals);
    });
    const number = value => Math.round(value).toLocaleString('es-CO');
    root.querySelectorAll('[data-meal-day-totals]').forEach(node => {
      const totals = days.get(node.dataset.mealDayTotals) || {planned:0,consumed:0};
      node.querySelector('[data-day-planned]').textContent = number(totals.planned) + ' kcal planeadas';
      node.querySelector('[data-day-consumed]').textContent = number(totals.consumed) + ' kcal consumidas';
    });
    const pending = [...days.values()].reduce((sum,day) => sum + day.planned, 0);
    const count = [...days.values()].filter(day => day.planned > 0).length;
    find('[data-meal-week-summary]').textContent = `Pendiente de la semana: ${number(pending)} kcal · promedio ${number(count ? pending / count : 0)} kcal/día en ${count} días planificados`;
  }
  updateWeekTotals();
  function updateSlot(slot, meal) {
    saved.set(slot.dataset.mealKey, structuredClone(meal));
    renderSlotSummary(slot, meal);
    slot.querySelector('[data-meal-status-label]').textContent = meal.status === 'consumed' ? (meal.consumption_mode === 'outside' ? 'Comida por fuera' : 'Consumida') : meal.items.length ? 'Planeada' : 'Sin planificar';
    slot.querySelector('[data-meal-status-label]').dataset.mealState = meal.status === 'consumed' ? meal.consumption_mode || 'home' : meal.items.length ? 'planned' : 'empty';
    if (!meal.items.length && meal.status !== 'consumed') slot.querySelector('[data-meal-caption]').innerHTML = '<span class="lt-meal-add-label"><i class="bi bi-plus-lg" aria-hidden="true"></i> Agregar</span>';
    slot.classList.toggle('lt-meal-slot--empty', !meal.items.length && meal.status !== 'consumed');
    updateWeekTotals();
  }
  root.querySelectorAll('[data-meal-key]').forEach(slot => renderSlotSummary(slot, mealAt(slot)));
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
    status.closest('.lt-split').dataset.mealState = status.value;
    status.textContent = {planned:'Planeada', home:'Consumida', outside:'Comida por fuera'}[status.value];
  };
  scope.on(find('[data-meal-calories-override]'), 'input', renderNutrition);
  scope.on(list, 'change', event => {
    if (event.target.matches('[data-meal-kind]')) syncKind(event.target.closest('.lt-meal-composer'));
    renderNutrition();
  });
  scope.on(list, 'input', renderNutrition);
  scope.on(root, 'click', event => {
    const openAction = event.target.closest('[data-meal-open-action]');
    if (openAction) {
      active = openAction.closest('.lt-meal-card').querySelector('[data-meal-key]');
      selectedAction = openAction.dataset.mealOpenAction;
      const label = {move:'Mover', copy:'Copiar', swap:'Intercambiar', delete:'Eliminar'}[selectedAction];
      find('#meal-action-dialog-title').textContent = label + ' comida';
      actionLayer.querySelector('[data-lt-action="run-meal-action"]').textContent = label;
      find('[data-meal-action-source]').textContent = active.dataset.mealLabel;
      find('[data-meal-action-target]').hidden = selectedAction === 'delete';
      find('[data-meal-delete-confirm]').hidden = selectedAction !== 'delete';
      find('[data-meal-action-error]').textContent = '';
      find('[data-meal-target-date]').value = '2026-09-' + active.dataset.mealKey.split('-')[0].padStart(2,'0');
      find('[data-meal-target-type]').value = active.dataset.mealKey.split('-')[1];
      const menu = openAction.closest('.lt-menu'); menu.hidden = true;
      openAction.closest('.lt-menu-anchor').querySelector('[aria-expanded]').setAttribute('aria-expanded','false');
      return;
    }
    const rearrange = event.target.closest('[data-lt-action="run-meal-action"]');
    if (rearrange && active) {
      const error = find('[data-meal-action-error]'); error.textContent = '';
      const source = mealAt(active), action = selectedAction;
      if (source.status === 'consumed' || !source.items.length) { error.textContent = 'Selecciona una comida guardada y planeada para realizar esta acción.'; return; }
      if (action === 'delete') updateSlot(active, emptyMeal());
      else {
        const date = find('[data-meal-target-date]');
        if (!date.reportValidity()) return;
        const key = String(Number(date.value.slice(-2))) + '-' + find('[data-meal-target-type]').value;
        const target = [...root.querySelectorAll('[data-meal-key]')].find(slot => slot.dataset.mealKey === key);
        if (!target || target === active) { error.textContent = 'Elige otra casilla de esta semana.'; return; }
        const destination = mealAt(target);
        if (destination.status === 'consumed') { error.textContent = 'La comida destino ya fue consumida.'; return; }
        if (action === 'swap') {
          if (!destination.items.length) { error.textContent = 'Para intercambiar elige una casilla con comida.'; return; }
          updateSlot(active, destination); updateSlot(target, source);
        } else {
          updateSlot(target, destination.items.length ? {...destination, items:[...destination.items, ...source.items]} : source);
          if (action === 'move') updateSlot(active, emptyMeal());
        }
      }
      actionLayer.hidden = true; active.closest('.lt-meal-card').querySelector('.lt-meal-card__actions > button').focus(); return;
    }
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
      find('[data-meal-target-date]').value = '2026-09-' + slot.dataset.mealKey.split('-')[0].padStart(2,'0');
      find('[data-meal-target-type]').value = slot.dataset.mealKey.split('-')[1];
      find('[data-meal-action-error]').textContent = '';
      find('[data-meal-delete-confirm]').hidden = true;
      draft = mealAt(slot);
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
      updateWeekTotals();
      active.querySelector('[data-meal-status-label]').textContent = {planned:'Planeada', home:'Consumida', outside:'Comida por fuera'}[status.value];
      renderSlotSummary(active, draft);
      active.querySelector('[data-meal-status-label]').dataset.mealState = status.value;
      if (!draft.items.length && draft.status === 'planned') active.querySelector('[data-meal-caption]').innerHTML = '<span class="lt-meal-add-label"><i class="bi bi-plus-lg" aria-hidden="true"></i> Agregar</span>';
      active.classList.toggle('lt-meal-slot--empty', !draft.items.length && draft.status === 'planned');
      layer.hidden = true; active.focus();
    }
  });
}

// Asistente «Convertir en variante de…»: el producto elegido pasa a ser variante de otro y se elimina.
function mountIngredientMerge(root, scope) {
  const dialog = root.querySelector('#ingredient-merge');
  if (!dialog) return;
  const box = dialog.querySelector('[data-merge-target]');
  const input = box.querySelector('input');
  const list = box.querySelector('[role="listbox"]');
  const flavor = dialog.querySelector('[data-merge-flavor]');
  const normalize = text => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
  let source = null;
  // Diferencia entre nombres: «Aromática de manzanilla» respecto a «Aromática» → «manzanilla».
  const difference = (name, base) => name.slice(base.length).replace(/^\s*(de|con|en|sin)?\s+/i, '').trim();
  const renderVariants = () => {
    const tag = flavor.value.trim();
    const items = [['Hindú', 'Caja · 20 und'], ['Jaibel', 'Caja · 25 und']];
    dialog.querySelector('[data-merge-variants]').innerHTML = items.map(([brand, size]) => '<li><span>' + brand + ' · ' + size + '</span><span>→ ' + brand + (tag ? ' · <strong>' + tag + '</strong>' : '') + ' · ' + size + '</span></li>').join('');
  };
  scope.on(root, 'click', event => {
    const open = event.target.closest('[data-lt-toggle="ingredient-merge"]');
    if (open?.closest('[data-ingredient]')) {
      source = open.closest('[data-ingredient]');
      const name = source.dataset.ingredient;
      dialog.querySelectorAll('[data-merge-source]').forEach(node => { node.textContent = name; });
      dialog.querySelector('[data-merge-stock]').textContent = source.querySelector('[data-ingredient-stock]').textContent.trim() === '—' ? 'nada' : source.querySelector('[data-ingredient-stock]').textContent.trim();
      dialog.querySelector('[data-merge-error]').textContent = '';
      const others = [...root.querySelectorAll('tr[data-ingredient]')].map(row => row.dataset.ingredient).filter(other => other !== name);
      list.querySelectorAll('[role="option"]').forEach(option => option.remove());
      const empty = list.querySelector('.lt-combobox__empty');
      others.forEach(other => { const option = document.createElement('li'); option.setAttribute('role', 'option'); option.textContent = other; list.insertBefore(option, empty); });
      const suggestion = others.filter(other => normalize(name).startsWith(normalize(other) + ' ')).sort((a, b) => b.length - a.length)[0];
      input.value = suggestion || '';
      flavor.value = suggestion ? difference(name, suggestion) : '';
      dialog.querySelector('[data-merge-suggestion]').hidden = !suggestion;
      renderVariants();
    }
    if (event.target.closest('[data-lt-action="merge-ingredient"]') && source) {
      const target = [...root.querySelectorAll('tr[data-ingredient]')].find(row => row.dataset.ingredient === input.value.trim());
      if (!target) { dialog.querySelector('[data-merge-error]').textContent = 'Elige el producto principal de la lista.'; input.focus(); return; }
      const tag = flavor.value.trim();
      const offers = target.querySelector('[data-ingredient-offers]');
      offers.textContent = offers.textContent + ' · + variante' + (tag ? ' ' + tag : '') + ' (de ' + source.dataset.ingredient + ')';
      source.remove(); source = null; dialog.hidden = true;
      target.classList.add('is-merge-updated');
      target.querySelector('.lt-split__main')?.focus();
    }
  });
  scope.on(flavor, 'input', renderVariants);
  scope.on(input, 'change', () => { dialog.querySelector('[data-merge-suggestion]').hidden = true; });
}

function mountIngredientEditor(root, scope) {
  root.querySelectorAll('[data-lt-combobox]').forEach(box => {
    const input = box.querySelector('input'), list = box.querySelector('[role="listbox"]'), empty = list.querySelector('.lt-combobox__empty');
    const options = () => [...list.querySelectorAll('[role="option"]')];
    const visible = () => options().filter(option => !option.hidden);
    const toggle = open => { list.hidden = !open; input.setAttribute('aria-expanded', open); if (!open) options().forEach(option => option.classList.remove('is-active')); };
    const normalize = text => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    const filter = () => { const term = normalize(input.value.trim()); options().forEach(option => { option.hidden = !normalize(option.textContent).includes(term); option.classList.remove('is-active'); }); empty.hidden = visible().length > 0; toggle(true); };
    const choose = option => { input.value = option.textContent; toggle(false); input.dispatchEvent(new Event('change', {bubbles:true})); };
    scope.on(input, 'focus', () => { options().forEach(option => { option.hidden = false; }); empty.hidden = true; toggle(true); });
    scope.on(input, 'input', filter);
    scope.on(input, 'keydown', event => {
      const items = visible(), current = items.findIndex(option => option.classList.contains('is-active'));
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); if (list.hidden) toggle(true); const next = items[(current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]; items.forEach(option => option.classList.toggle('is-active', option === next)); next?.scrollIntoView({block:'nearest'}); }
      else if (event.key === 'Enter' && current >= 0) { event.preventDefault(); choose(items[current]); }
      else if (event.key === 'Escape' && !list.hidden) { event.stopPropagation(); toggle(false); }
    });
    scope.on(list, 'mousedown', event => { event.preventDefault(); const option = event.target.closest('[role="option"]'); if (option) choose(option); });
    scope.on(input, 'blur', () => toggle(false));
  });
  const modal = root.querySelector('#ingredient-new');
  if (!modal) return;
  const find = selector => modal.querySelector(selector);
  const variants = find('[data-ingredient-variants]'), prices = find('[data-ingredient-prices]');
  const saved = new Map(); let active = null, pendingDelete = null, nextId = 0;
  const fields = (row, attr) => Object.fromEntries([...row.querySelectorAll('[' + attr + ']')].map(input => [input.getAttribute(attr), input.type === 'checkbox' ? input.checked : input.value]));
  function syncVariants() {
    const options = [...variants.children].map((row,index) => {
      const data = fields(row,'data-variant-field');
      const label = 'Variante ' + (index + 1) + (data.brand ? ' · ' + data.brand : '') + (data.flavor ? ' · ' + data.flavor : '') + (data.content ? ' · ' + data.content + ' ' + data.content_unit : '') + (data.packaging ? ' · ' + data.packaging : '');
      row.querySelector('[data-variant-title]').textContent = label;
      return {id:row.dataset.variantId,label};
    });
    prices.querySelectorAll('[data-price-field="variant"]').forEach(select => {
      const value = select.value;
      select.replaceChildren(new Option('Seleccionar variante',''), ...options.map(option => new Option(option.label,option.id)));select.value=value;
    });
  }
  function addVariant(data = {}) {
    const row = find('[data-ingredient-variant-template]').content.firstElementChild.cloneNode(true);
    row.dataset.variantId = data.id || 'variant-' + (++nextId);
    row.querySelectorAll('[data-variant-field]').forEach(input => { input.value = data[input.dataset.variantField] ?? ''; });
    variants.append(row); syncVariants(); syncPriceMetadata(row); return row;
  }
  const variantMetaLabels = {units_per_pack:'Unidades',kcal:'Kcal',barcode:'Código'};
  const toggleInline = (group, open) => group.querySelectorAll('[data-price-inline]').forEach(wrapper => { wrapper.querySelector('[data-price-edit]').hidden = open; wrapper.querySelector('[data-price-control]').hidden = !open; });
  const aliases = find('[data-ingredient-aliases]');
  function setAliasCount(count) {
    while (aliases.children.length > Math.max(1, count)) aliases.lastElementChild.remove();
    while (aliases.children.length < count) { const row = aliases.firstElementChild.cloneNode(true); const input = row.querySelector('input'); input.value = ''; input.placeholder = ''; aliases.append(row); }
    [...aliases.children].forEach((row, index) => { row.querySelector('span').textContent = 'Alias ' + (index + 1); });
    return aliases.lastElementChild.querySelector('input');
  }
  function syncPriceMetadata(row) {
    row.querySelectorAll('[data-price-inline]').forEach(wrapper => {
      const input = wrapper.querySelector('[data-price-field],[data-variant-field]');
      if (input.dataset.variantField) { wrapper.querySelector('[data-price-edit]').textContent = variantMetaLabels[input.dataset.variantField] + ': ' + (input.value || 'Sin definir'); return; }
      wrapper.querySelector('[data-price-edit]').textContent = input.dataset.priceField === 'verified' ? (input.checked ? '✓ Verificado' : 'Sin verificar') : input.dataset.priceField === 'source' ? ('Fuente: ' + (input.selectedOptions[0]?.value ? input.selectedOptions[0].textContent : 'Sin definir')) : ('Fecha: ' + (input.value ? input.value.split('-').reverse().join('/') : 'Sin definir'));
    });
  }
  scope.on(modal,'change',event=>{const row=event.target.closest('article');if(row)syncPriceMetadata(row);});
  const formatThousands = value => { const digits = String(value).replace(/\D/g, ''); return digits ? Number(digits).toLocaleString('es-CO') : ''; };
  scope.on(prices,'input',event=>{
    const input = event.target; if (!input.matches('[data-price-field="amount"]')) return;
    const digitsAfter = input.value.slice(input.selectionStart).replace(/\D/g, '').length;
    input.value = formatThousands(input.value);
    let caret = input.value.length; for (let seen = 0; caret > 0 && seen < digitsAfter; caret--) if (/\d/.test(input.value[caret - 1])) seen++;
    input.setSelectionRange(caret, caret);
  });
  function addPrice(data = {}) {
    const row = find('[data-ingredient-price-template]').content.firstElementChild.cloneNode(true);prices.append(row);syncVariants();
    row.querySelectorAll('[data-price-field]').forEach(input => { if(input.type === 'checkbox') input.checked = data[input.dataset.priceField] || false; else input.value = input.dataset.priceField === 'amount' ? formatThousands(data.amount ?? '') : data[input.dataset.priceField] ?? ''; });
    syncPriceMetadata(row);
    return row;
  }
  scope.on(variants,'input',syncVariants);
  scope.on(root,'click',event => {
    modal.querySelectorAll('.lt-price-metadata').forEach(group=>{if(!group.contains(event.target)) toggleInline(group,false);});
    const edit = event.target.closest('[data-price-edit]');
    if(edit) {toggleInline(edit.closest('.lt-price-metadata'),true);edit.closest('[data-price-inline]').querySelector('[data-price-field],[data-variant-field]').focus();return;}
    const trigger = event.target.closest('[data-lt-toggle="ingredient-new"]');
    if (trigger && !modal.hidden && !modal.contains(trigger)) {
      active = trigger.closest('[data-ingredient]');
      modal.querySelectorAll('input').forEach(input => { input.value='';input.checked=false; });
      const state = active ? saved.get(active.dataset.ingredient) : null;
      find('[data-ingredient-name]').value = state?.name || active?.dataset.ingredient || '';
      find('#ingredient-new-title').textContent = active ? 'Editar ingrediente' : 'Agregar ingrediente';
      variants.replaceChildren();prices.replaceChildren();setAliasCount(state?.aliasCount || 1);
      const initial = state || (active ? {variants:[{id:'example',packaging:'Unidad',content:'1',content_unit:'unidad',units_per_pack:'1'}],prices:[{variant:'example',store:'Éxito',amount:'4500',source:'manual',date:'2026-10-12',verified:false},{variant:'example',store:'Carulla',amount:'5200',source:'manual',date:'2026-10-12',verified:false}]} : {variants:[],prices:[]});
      initial.variants.forEach(addVariant);initial.prices.forEach(addPrice);
      if(state?.otherFields) [...modal.querySelectorAll('[data-section="basic"] input,[data-section="basic"] select,[data-section="inventory"] input,[data-section="aliases"] input')].forEach((input,index)=>{if(input.type==='checkbox') input.checked=state.otherFields[index]===true; else input.value=state.otherFields[index] ?? '';});
      find('[data-ingredient-price-error]').textContent='';
      find('[data-lt-dialog-section="basic"]').click();
    }
    const deleteTrigger = event.target.closest('[data-lt-toggle="ingredient-delete"]');
    if (deleteTrigger?.closest('[data-ingredient]')) { pendingDelete = deleteTrigger.closest('[data-ingredient]'); root.querySelector('[data-ingredient-delete-name]').textContent = pendingDelete.querySelector('strong').textContent; }
    if (event.target.closest('[data-lt-action="delete-ingredient"]') && pendingDelete) { saved.delete(pendingDelete.dataset.ingredient); pendingDelete.remove(); pendingDelete = null; root.querySelector('#ingredient-delete').hidden = true; return; }
    const removeAlias=event.target.closest('[data-remove-alias]');
    if(removeAlias) {const row=removeAlias.closest('.lt-alias-row');if(aliases.children.length>1){row.remove();setAliasCount(aliases.children.length);}else row.querySelector('input').value='';return;}
    if(event.target.closest('[data-ingredient-add-alias]')) setAliasCount(aliases.children.length + 1).focus();
    if(event.target.closest('[data-ingredient-add-variant]')) addVariant().querySelector('input').focus();
    if(event.target.closest('[data-ingredient-add-price]')) {
      if(!variants.children.length) {find('[data-ingredient-price-error]').textContent='Agrega una variante antes de registrar precios.';return;}
      addPrice().querySelector('select').focus();
    }
    const removeVariant=event.target.closest('[data-remove-variant]');
    if(removeVariant) {
      const row=removeVariant.closest('[data-variant-id]');const id=row.dataset.variantId;
      [...prices.children].filter(price=>price.querySelector('[data-price-field="variant"]').value===id).forEach(price=>price.remove());row.remove();syncVariants();
    }
    const removePrice=event.target.closest('[data-remove-price]');if(removePrice) removePrice.closest('article').remove();
    if(event.target.closest('[data-lt-action="save-ingredient"]')) {
      const invalid=[...modal.querySelectorAll('input,select')].find(input=>!input.checkValidity());
      if(invalid) {find('[data-lt-dialog-section="'+invalid.closest('[data-section]').dataset.section+'"]').click();const inline=invalid.closest('[data-price-inline]');if(inline) toggleInline(inline.closest('.lt-price-metadata'),true);invalid.reportValidity();invalid.focus();return;}
      const state={name:find('[data-ingredient-name]').value,variants:[...variants.children].map(row=>({id:row.dataset.variantId,...fields(row,'data-variant-field')})),prices:[...prices.children].map(row=>{const price=fields(row,'data-price-field');price.amount=price.amount.replace(/\D/g,'');return price;})};
      state.aliasCount = aliases.children.length;
      state.otherFields = [...modal.querySelectorAll('[data-section="basic"] input,[data-section="basic"] select,[data-section="inventory"] input,[data-section="aliases"] input')].map(input=>input.type==='checkbox'?input.checked:input.value);
      if(!active) {
        const example = root.querySelector('[data-ingredient]');
        active = example.cloneNode(true); active.dataset.ingredient = 'local-' + (++nextId);
        active.querySelector('[data-ingredient-detail]')?.remove();
        active.querySelector('[data-ingredient-stock]').textContent = '—';
        active.querySelector('[data-ingredient-category]').textContent = 'Sin categoría';
        active.querySelector('.lt-chip').textContent = 'Sin stock';
        const menuId = 'ingredient-menu-' + active.dataset.ingredient;
        active.querySelector('[role="menu"]').id = menuId;
        active.querySelectorAll('[aria-haspopup="menu"]').forEach(button => { button.dataset.ltToggle = menuId; button.setAttribute('aria-expanded', 'false'); });
        active.querySelector('[role="menu"]').hidden = true;
        example.parentElement.append(active);
      }
      if(active) {
        saved.set(active.dataset.ingredient,state);active.querySelector('strong').textContent=state.name;active.querySelector('[data-ingredient-category]').textContent=root.querySelector('#ingredient-new [data-lt-combobox] input').value||'Sin categoría';
        active.querySelector('[data-ingredient-offers]').textContent=state.prices.map(price=>{const v=state.variants.find(v=>v.id===price.variant);return price.store+' · $'+Number(price.amount).toLocaleString('es-CO')+' · '+[v?.brand,v?.content,v?.content_unit,v?.packaging].filter(Boolean).join(' ');}).join(' | ') || 'Sin precios registrados';
      }
      modal.hidden=true;active?.querySelector('.lt-split__main')?.focus();
    }
  });
}
