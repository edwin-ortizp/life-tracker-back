export function mountLifeShell({root, scope, toast}) {
  const compact = () => window.matchMedia('(max-width: 767.98px)').matches;
  const closePopups = except => [...new Set([...root.querySelectorAll('[data-lt-toggle]')].map(b => b.dataset.ltToggle))].forEach(id => { const el = root.querySelector('#' + id); if (el && el !== except && !(except && el.contains(except)) && !el.hidden) { el.hidden = true; root.querySelectorAll('[data-lt-toggle="' + id + '"][aria-expanded]').forEach(b => b.setAttribute('aria-expanded', 'false')); } });
  const syncFilterCount = () => { const count = root.querySelectorAll('[data-lt-remove-filter]').length; const badge = root.querySelector('[data-lt-filter-count]'); if (badge) { badge.textContent = count; badge.hidden = count === 0; badge.setAttribute('aria-label', count + (count === 1 ? ' filtro activo' : ' filtros activos')); } const link = root.querySelector('[data-lt-clear-filters].lt-link'); if (link) link.hidden = count === 0; };
  const readStore = key => { try { return sessionStorage.getItem(key); } catch (error) { return null; } };
  const dropStore = key => { try { sessionStorage.removeItem(key); } catch (error) { /* sin almacenamiento */ } };
  const zoneFilter = readStore('lt-health-zone');
  const applied = root.querySelector('.lt-applied-filters');
  if (zoneFilter && applied && root.querySelector('[data-lt-visible-count]') && !applied.querySelector('[data-zone-chip]')) {
    const chip = document.createElement('span');
    chip.className = 'lt-chip lt-chip--input';
    chip.dataset.zoneChip = '';
    chip.innerHTML = '<i class="bi bi-person-standing"></i> <span></span><button class="lt-chip__remove" type="button" data-lt-remove-filter><i class="bi bi-x"></i></button>';
    chip.querySelector('span').textContent = 'Zona del cuerpo: ' + zoneFilter;
    chip.querySelector('button').setAttribute('aria-label', 'Quitar filtro Zona del cuerpo: ' + zoneFilter);
    applied.prepend(chip);
    const rangeFilter = readStore('lt-health-range');
    const rangeLabel = root.querySelector('[data-filter="range"] [data-filter-label]');
    if (rangeFilter && rangeLabel) rangeLabel.textContent = rangeFilter;
    syncFilterCount();
  }
  scope.on(root, 'click', event => {
    if (event.target.closest('.lt-multiselect__panel') && !event.target.closest('.lt-multiselect__option')) return;
    const dlg = event.target.closest('.lt-dialog');
    const sidebar = event.target.closest('[data-lt-dialog-sidebar]');
    if (sidebar && dlg) { const open = compact() ? dlg.classList.toggle('is-nav-open') : !dlg.classList.toggle('is-nav-collapsed'); sidebar.setAttribute('aria-expanded', String(open)); return; }
    const expand = event.target.closest('[data-lt-dialog-expand]');
    if (expand && dlg) { const on = dlg.classList.toggle('is-expanded'); expand.setAttribute('aria-pressed', String(on)); expand.setAttribute('aria-label', on ? 'Restaurar' : 'Expandir'); expand.querySelector('i').className = 'bi ' + (on ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'); return; }
    const section = event.target.closest('[data-lt-dialog-section]');
    if (section && dlg) { dlg.querySelectorAll('[data-lt-dialog-section]').forEach(b => b === section ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')); dlg.querySelectorAll('.lt-dialog__section').forEach(p => { p.hidden = p.dataset.section !== section.dataset.ltDialogSection; }); dlg.classList.remove('is-nav-open'); if (compact()) dlg.querySelector('[data-lt-dialog-sidebar]')?.setAttribute('aria-expanded', 'false'); return; }
    const toggle = event.target.closest('[data-lt-toggle]');
    if (toggle) { const el = root.querySelector('#' + toggle.dataset.ltToggle); if (el) { closePopups(el); el.hidden = !el.hidden; root.querySelectorAll('[data-lt-toggle="' + toggle.dataset.ltToggle + '"][aria-expanded]').forEach(b => b.setAttribute('aria-expanded', String(!el.hidden))); } return; }
    const remove = event.target.closest('[data-lt-remove-filter]');
    const clear = event.target.closest('[data-lt-clear-filters]');
    if (remove || clear) { (clear ? root.querySelectorAll('[data-lt-remove-filter]') : [remove]).forEach(b => { const chip = b.closest('.lt-chip'); if (chip?.hasAttribute('data-zone-chip')) { dropStore('lt-health-zone'); dropStore('lt-health-range'); } chip?.remove(); }); const count = root.querySelectorAll('[data-lt-remove-filter]').length; const badge = root.querySelector('[data-lt-filter-count]'); if (badge) { badge.textContent = count; badge.hidden = count === 0; badge.setAttribute('aria-label', count + ' filtros activos'); } const link = root.querySelector('[data-lt-clear-filters]'); if (link) link.hidden = count === 0; const counter = root.querySelector('[data-lt-visible-count]'); if (counter && count === 0) counter.textContent = '(28 de 28)'; return; }
    if (!event.target.closest('.lt-popover,.lt-menu,.lt-dialog')) closePopups(null);
    if (event.target.closest('.lt-multiselect__option')) { const panel = event.target.closest('.lt-multiselect__panel'); const picked = [...panel.querySelectorAll('input:checked')].map(i => i.parentElement.textContent.trim()); root.querySelector('[data-lt-toggle="' + panel.id + '"] span').textContent = picked.length ? picked.join(', ') : 'Todos los tipos'; return; }
    const action = event.target.closest('[data-lt-nav-toggle],[data-lt-open-drawer],[data-lt-close-drawer],[data-lt-static-nav],[data-lt-search]');
    if (!action) return;
    const shell = action.closest('.lt-shell');
    if (!shell) return;
    if (action.hasAttribute('data-lt-nav-toggle')) { shell.classList.toggle(compact() ? 'is-drawer-open' : 'is-rail'); return; }
    if (action.hasAttribute('data-lt-open-drawer')) { shell.classList.add('is-drawer-open'); return; }
    if (action.hasAttribute('data-lt-close-drawer')) { shell.classList.remove('is-drawer-open'); return; }
    if (action.hasAttribute('data-lt-search')) { shell.querySelector('[data-lt-search-input]')?.focus(); return; }
    toast('Este destino se muestra como referencia y no forma parte de este mockup.');
  });
  scope.on(window, 'keydown', event => { if (event.key === 'Escape') closePopups(null); if (event.key === 'Escape') root.querySelector('.lt-shell')?.classList.remove('is-drawer-open'); });
}
