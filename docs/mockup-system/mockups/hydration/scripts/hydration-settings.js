// Ajustes de hidratación: catálogo de bebidas (crear, editar, eliminar, buscar, filtrar, ordenar) y meta diaria, en memoria.
const esc = value => String(value).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);
const num = (value, digits) => Number(value).toLocaleString('es-CO', {minimumFractionDigits: digits, maximumFractionDigits: digits});
const FACTOR_LABELS = {low: 'Hidrata menos (< 1)', neutral: 'Igual al agua (1)', high: 'Hidrata más (> 1)'};
const USAGE_LABELS = {used: 'Con registros', unused: 'Sin registros'};
const SORT_KEYS = {name: 'ascending', factor: 'descending', logs: 'descending'};

export function mountDrinkSettings({root, scope, toast}) {
  const tbody = root.querySelector('[data-drink-rows]');
  if (!tbody) return;
  let drinks = [['💧', 'Agua', 1, 142], ['☕', 'Café', 0.8, 38], ['🍵', 'Té verde', 0.9, 12], ['🥛', 'Leche', 0.9, 6], ['🧃', 'Jugo de naranja', 0.85, 4], ['⚡', 'Bebida isotónica', 1.1, 0], ['🥥', 'Agua de coco', 1.05, 0], ['🍺', 'Cerveza', 0.4, 0]]
    .map(([icon, name, factor, logs], i) => ({id: i + 1, icon, name, factor, logs}));
  let nextId = drinks.length + 1;
  const state = {search: '', factor: 'all', usage: 'all', sort: 'name'};
  let editingId = null;
  let deletingId = null;

  const dialog = root.querySelector('#drink-type-dialog');
  const field = key => dialog.querySelector(`[data-drink-field="${key}"]`);
  const searchInput = root.querySelector('#drink-types .lt-mcard__search input');

  const matches = d => {
    if (state.search && !d.name.toLowerCase().includes(state.search.toLowerCase())) return false;
    if (state.factor === 'low' && !(d.factor < 1)) return false;
    if (state.factor === 'neutral' && d.factor !== 1) return false;
    if (state.factor === 'high' && !(d.factor > 1)) return false;
    if (state.usage === 'used' && !d.logs) return false;
    if (state.usage === 'unused' && d.logs) return false;
    return true;
  };
  const compare = (a, b) => state.sort === 'factor' ? b.factor - a.factor || a.name.localeCompare(b.name, 'es')
    : state.sort === 'logs' ? b.logs - a.logs || a.name.localeCompare(b.name, 'es') : a.name.localeCompare(b.name, 'es');

  const rowHtml = d => {
    const menu = `drink-menu-${d.id}`;
    const label = esc(d.name);
    return `<tr data-drink-id="${d.id}">
      <td class="lt-mtable__type" data-label="Bebida"><span aria-hidden="true">${esc(d.icon)}</span> <strong>${label}</strong></td>
      <td data-label="Factor"><div class="lt-mtable__factor"><span>×${num(d.factor, 2)}</span><div class="lt-progress" role="img" aria-label="Factor ${num(d.factor, 2)}"><span style="width:${Math.min(100, Math.round(d.factor * 100 / 1.5))}%"></span></div></div></td>
      <td data-label="Registros">${d.logs ? num(d.logs, 0) : 'Sin registros'}</td>
      <td class="lt-mtable__actions"><div class="lt-menu-anchor lt-row-split">
        <div class="lt-split"><button class="lt-button lt-split__main" type="button" data-lt-action="drink-edit">Editar</button><button class="lt-button lt-split__toggle" type="button" data-lt-toggle="${menu}" aria-haspopup="menu" aria-expanded="false" aria-label="Más acciones de ${label}"><i class="bi bi-chevron-down"></i></button></div>
        <button class="lt-icon-button lt-row-more" type="button" data-lt-toggle="${menu}" aria-haspopup="menu" aria-expanded="false" aria-label="Acciones de ${label}"><i class="bi bi-three-dots-vertical"></i></button>
        <div class="lt-menu lt-menu--down" id="${menu}" role="menu" hidden><button class="lt-menu__item lt-row-more__edit" role="menuitem" type="button" data-lt-action="drink-edit">Editar</button><hr class="lt-menu__divider"><button class="lt-menu__item lt-menu__item--danger" role="menuitem" type="button" data-lt-action="drink-delete"><i class="bi bi-trash"></i> Eliminar</button></div>
      </div></td></tr>`;
  };

  const chip = (key, icon, text) => `<span class="lt-chip lt-chip--input" data-drink-chip="${key}"><i class="bi ${icon}"></i> <span>${esc(text)}</span><button class="lt-chip__remove" type="button" data-drink-chip-remove="${key}" aria-label="Quitar filtro ${esc(text)}"><i class="bi bi-x"></i></button></span>`;

  const render = () => {
    const visible = drinks.filter(matches).sort(compare);
    tbody.innerHTML = visible.map(rowHtml).join('');
    root.querySelector('[data-drink-empty]').hidden = visible.length > 0;
    const total = drinks.length;
    const counter = root.querySelector('#drink-types [data-lt-visible-count]');
    counter.textContent = `(${visible.length} / ${total})`;
    counter.dataset.total = total;
    root.querySelector('#drink-types .lt-mcard__range').innerHTML = visible.length ? `Mostrando <strong>1–${visible.length}</strong> de <strong>${total}</strong> bebidas` : `Mostrando <strong>0</strong> de <strong>${total}</strong> bebidas`;
    const chips = [];
    if (state.search) chips.push(chip('search', 'bi-search', `Búsqueda: ${state.search}`));
    if (state.factor !== 'all') chips.push(chip('factor', 'bi-droplet-half', `Factor: ${FACTOR_LABELS[state.factor]}`));
    if (state.usage !== 'all') chips.push(chip('usage', 'bi-clock-history', `Uso: ${USAGE_LABELS[state.usage]}`));
    root.querySelector('[data-drink-chips]').innerHTML = chips.join('');
    const badge = root.querySelector('#drink-types [data-lt-filter-count]');
    const active = (state.factor !== 'all') + (state.usage !== 'all');
    badge.textContent = active; badge.hidden = !active; badge.setAttribute('aria-label', `${active} ${active === 1 ? 'filtro activo' : 'filtros activos'}`);
    root.querySelectorAll('[data-drink-sort-col]').forEach(b => { const th = b.closest('th'); if (b.dataset.drinkSortCol === state.sort) th.setAttribute('aria-sort', SORT_KEYS[state.sort]); else th.removeAttribute('aria-sort'); });
  };

  const syncFilterControls = () => {
    root.querySelectorAll('[data-drink-factor]').forEach(b => { const on = b.dataset.drinkFactor === state.factor; b.classList.toggle('is-selected', on); b.setAttribute('aria-pressed', String(on)); });
    root.querySelector('[data-drink-usage]').value = state.usage;
    const current = root.querySelector(`[data-lt-sort="${state.sort}"]`);
    root.querySelectorAll('[data-lt-sort]').forEach(b => b === current ? b.setAttribute('aria-checked', 'true') : b.removeAttribute('aria-checked'));
    const label = current.textContent.trim(); root.querySelector('[data-lt-sort-label]').textContent = label; root.querySelector('[data-lt-toggle="drink-types-sort"]').setAttribute('aria-label', `Ordenar por ${label}`);
  };

  const setError = (input, message) => {
    const wrap = input.closest('.lt-field'); const error = wrap.querySelector('.lt-field__error');
    wrap.classList.toggle('is-error', Boolean(message)); error.textContent = message || ''; error.hidden = !message;
    input.setAttribute('aria-invalid', String(Boolean(message)));
  };

  const openForm = drink => {
    editingId = drink ? drink.id : null;
    dialog.querySelector('.lt-dialog__head h2').textContent = drink ? 'Editar bebida' : 'Nueva bebida';
    field('icon').value = drink ? drink.icon : '';
    field('name').value = drink ? drink.name : '';
    field('factor').value = drink ? drink.factor : 1;
    ['icon', 'name', 'factor'].forEach(k => setError(field(k), ''));
  };

  const close = id => { const el = root.querySelector('#' + id); if (el) el.hidden = true; };
  const closeMenus = () => root.querySelectorAll('#drink-types .lt-menu').forEach(m => { m.hidden = true; });

  const save = () => {
    const icon = field('icon').value.trim();
    const name = field('name').value.trim();
    const rawFactor = field('factor').value.trim();
    const factor = Number(rawFactor);
    let ok = true;
    const check = (key, message) => { setError(field(key), message); if (message) ok = false; };
    check('icon', icon ? '' : 'El ícono es obligatorio.');
    check('name', !name ? 'El nombre es obligatorio.' : drinks.some(d => d.id !== editingId && d.name.toLowerCase() === name.toLowerCase()) ? 'Ya existe una bebida con ese nombre.' : '');
    check('factor', rawFactor === '' ? 'El factor es obligatorio.' : Number.isNaN(factor) || factor < 0 || factor > 9.99 ? 'Usa un valor entre 0 y 9,99.' : '');
    if (!ok) { dialog.querySelector('.is-error input')?.focus(); return; }
    const rounded = Math.round(factor * 100) / 100;
    if (editingId) Object.assign(drinks.find(d => d.id === editingId), {icon, name, factor: rounded});
    else drinks.push({id: nextId++, icon, name, factor: rounded, logs: 0});
    close('drink-type-dialog');
    render();
    toast(editingId ? 'Bebida actualizada.' : 'Bebida creada.');
  };

  const goalHint = ml => `≈ ${num(Math.round(ml / 250), 0)} vasos de 250 ml`;

  scope.on(root, 'click', event => {
    if (event.target.closest('#drink-type-dialog .lt-dialog__head [data-lt-toggle], .lt-fab[data-lt-toggle="drink-type-dialog"]')) {
      if (event.target.closest('.lt-fab')) openForm(null);
      return;
    }
    const factorChip = event.target.closest('[data-drink-factor]');
    if (factorChip) { root.querySelectorAll('[data-drink-factor]').forEach(b => { const on = b === factorChip; b.classList.toggle('is-selected', on); b.setAttribute('aria-pressed', String(on)); }); return; }
    const sortCol = event.target.closest('[data-drink-sort-col]');
    const sortItem = event.target.closest('[data-lt-sort]');
    if (sortItem) { state.sort = sortItem.dataset.ltSort; close('drink-types-sort'); syncFilterControls(); render(); return; }
    if (sortCol) { state.sort = sortCol.dataset.drinkSortCol; syncFilterControls(); render(); return; }
    const removeChip = event.target.closest('[data-drink-chip-remove]');
    if (removeChip) {
      const key = removeChip.dataset.drinkChipRemove;
      if (key === 'search') { state.search = ''; if (searchInput) searchInput.value = ''; } else state[key] = 'all';
      syncFilterControls(); render(); return;
    }
    const action = event.target.closest('[data-lt-action]');
    if (!action) return;
    const row = action.closest('[data-drink-id]');
    const drink = row && drinks.find(d => d.id === Number(row.dataset.drinkId));
    switch (action.dataset.ltAction) {
      case 'drink-edit':
        closeMenus(); openForm(drink); root.querySelector('#drink-type-dialog').hidden = false; field('name').focus(); break;
      case 'drink-delete': {
        closeMenus(); deletingId = drink.id;
        const layer = root.querySelector('#drink-type-delete');
        const button = layer.querySelector('[data-lt-action="drink-delete-confirm"]');
        layer.querySelector('[data-drink-delete-text]').textContent = drink.logs
          ? `«${drink.name}» tiene ${num(drink.logs, 0)} registros de hidratación y no se puede eliminar; tu historial se conserva.`
          : `«${drink.name}» no tiene registros; se eliminará de tu catálogo.`;
        button.disabled = Boolean(drink.logs);
        layer.hidden = false; break;
      }
      case 'drink-delete-confirm': {
        const removed = drinks.find(d => d.id === deletingId);
        drinks = drinks.filter(d => d.id !== deletingId);
        close('drink-type-delete'); render(); toast(`Se eliminó «${removed.name}».`); break;
      }
      case 'drink-save': save(); break;
      case 'drink-filters-apply':
        state.factor = root.querySelector('[data-drink-factor].is-selected')?.dataset.drinkFactor || 'all';
        state.usage = root.querySelector('[data-drink-usage]').value;
        close('drink-types-filters'); render(); break;
      case 'drink-filters-clear':
        Object.assign(state, {factor: 'all', usage: 'all'}); syncFilterControls(); render(); break;
      case 'goal-save': {
        const input = root.querySelector('[data-goal-input]');
        const ml = Number(input.value);
        const invalid = input.value === '' || !Number.isInteger(ml) || ml < 500 || ml > 10000;
        input.closest('.lt-field').classList.toggle('is-error', invalid);
        root.querySelector('[data-goal-error]').hidden = !invalid;
        if (invalid) { input.focus(); break; }
        root.querySelector('[data-goal-value]').textContent = num(ml, 0);
        root.querySelector('[data-goal-hint]').textContent = goalHint(ml);
        toast('Meta diaria actualizada.'); break;
      }
    }
  });
  if (searchInput) scope.on(searchInput, 'input', () => { state.search = searchInput.value.trim(); render(); });
  scope.on(dialog, 'keydown', event => { if (event.key === 'Enter' && event.target.matches('input')) { event.preventDefault(); save(); } });
  render();
}
