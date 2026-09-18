import {mountLifeShell} from '@project/project-assets/life-shell.js';

const TONES = ['over', 'soon', 'ok', 'none'];
const HISTORY_KEY = 'lt-vehicle-history-item';

/**
 * Mapa del vehículo: vistas lateral y superior, etiquetas, chips de documentos y filas del plan
 * comparten `data-zone`. Pasar el puntero o el foco resalta todo; seleccionar filtra el plan
 * y muestra el detalle de la zona.
 */
export function mountVehicleMap(context) {
  mountLifeShell(context);
  const {root, scope} = context;
  const q = selector => root.querySelector(selector);
  const qa = selector => [...root.querySelectorAll(selector)];
  let view = 'side';

  // Las vistas se deducen de los trazados: no todas las zonas se dibujan en ambas.
  const viewsOf = id => [...new Set(qa(`svg [data-zone="${id}"]`).map(el => el.closest('svg').dataset.carSide))];
  const toneOf = el => TONES.find(tone => el.classList.contains(`lt-tone-${tone}`)) ?? 'none';

  const setView = next => {
    view = next;
    // <svg> no expone la propiedad `hidden`: se alterna el atributo directamente.
    qa('[data-car-side]').forEach(svg => svg.toggleAttribute('hidden', svg.dataset.carSide !== next));
    qa('[data-car-view]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.carView === next)); button.classList.remove('is-hint'); });
    q('[data-car-caption]').textContent = next === 'side' ? 'Vista lateral' : 'Vista superior · capó abierto';
  };

  const link = (id, on) => {
    qa(`[data-zone="${id}"]`).forEach(el => el.classList.toggle('is-linked', on));
    const views = viewsOf(id);
    qa('[data-car-view]').forEach(button => button.classList.toggle('is-hint', on && views.length > 0 && !views.includes(view) && views.includes(button.dataset.carView)));
  };

  const select = id => {
    qa('.is-selected').forEach(el => el.classList.remove('is-selected'));
    const rows = qa('.lt-care-row');
    rows.forEach(row => { row.hidden = Boolean(id) && row.dataset.zone !== id; });
    const shown = rows.filter(row => !row.hidden);
    const detail = q('[data-car-detail]');
    const applied = q('[data-plan-applied]');
    const counter = q('#vehicle-plan-items [data-lt-visible-count]');
    const badge = q('#vehicle-plan-items [data-lt-filter-count]');
    applied.hidden = !id;
    applied.replaceChildren();
    if (counter) counter.textContent = `(${shown.length} / ${rows.length})`;
    if (badge) { badge.textContent = id ? 1 : 0; badge.hidden = !id; }
    q('[data-care-empty]').hidden = shown.length > 0;
    q('[data-car-hint]').hidden = Boolean(id);
    detail.hidden = !id;
    if (!id) return;

    const marks = qa(`[data-zone="${id}"]:not(.lt-care-row)`);
    marks.forEach(el => el.classList.add('is-selected'));
    const views = viewsOf(id);
    if (views.length && !views.includes(view)) setView(views[0]);

    const label = marks[0]?.dataset.label ?? '';
    const count = `${shown.length} ${shown.length === 1 ? 'elemento' : 'elementos'}`;
    const urgent = shown[0];
    // Fila estándar de filtros aplicados: chip del sistema + «Limpiar filtros».
    applied.innerHTML = '<span class="lt-chip lt-chip--input"><i class="bi bi-car-front"></i> <span></span><button class="lt-chip__remove" type="button" data-lt-remove-filter><i class="bi bi-x"></i></button></span><button class="lt-link" type="button" data-lt-clear-filters>Limpiar filtros</button>';
    applied.querySelector('.lt-chip span').textContent = `Sistema: ${label}`;
    applied.querySelector('.lt-chip__remove').setAttribute('aria-label', `Quitar filtro Sistema: ${label}`);
    TONES.forEach(tone => detail.classList.toggle(`lt-tone-${tone}`, tone === (urgent ? toneOf(urgent) : 'none')));
    detail.querySelector('[data-detail-name]').textContent = label;
    detail.querySelector('[data-detail-meta]').textContent = urgent
      ? `${count} · Más urgente: ${urgent.querySelector('[data-plan-name]').textContent} (${urgent.querySelector('[data-plan-next]').textContent})`
      : 'Sin elementos del plan para esta zona';
  };

  scope.on(root, 'pointerover', event => { const el = event.target.closest('[data-zone]'); if (el) link(el.dataset.zone, true); });
  scope.on(root, 'pointerout', event => { const el = event.target.closest('[data-zone]'); if (el && !el.contains(event.relatedTarget)) link(el.dataset.zone, false); });
  scope.on(root, 'focusin', event => { const el = event.target.closest('[data-zone]'); if (el) link(el.dataset.zone, true); });
  scope.on(root, 'focusout', event => { const el = event.target.closest('[data-zone]'); if (el) link(el.dataset.zone, false); });

  // Un elemento del plan abre la pestaña Historial ya filtrada por él.
  const openHistory = item => {
    const row = qa('.lt-care-row').find(el => el.querySelector('[data-plan-name]')?.textContent === item);
    const rule = row ? `${row.querySelector('[data-plan-rule]').textContent} · ${row.querySelector('[data-plan-next]').textContent}` : '';
    try { sessionStorage.setItem(HISTORY_KEY, JSON.stringify({item, rule})); } catch {}
    location.hash = '#/vehicles-maintenance-history';
  };

  scope.on(root, 'click', event => {
    const historyLink = event.target.closest('[data-history-item], [data-lt-action="history"]');
    if (historyLink) {
      openHistory(historyLink.dataset.historyItem ?? historyLink.closest('.lt-care-row')?.querySelector('[data-history-item]')?.dataset.historyItem);
      return;
    }
    const toggle = event.target.closest('[data-car-view]');
    if (toggle) { setView(toggle.dataset.carView); return; }
    // life-shell quita el chip antes; aquí se restablece la selección del mapa.
    if (event.target.closest('[data-lt-remove-filter], [data-lt-clear-filters]')) { select(null); return; }
    const mark = event.target.closest('[data-zone]:not(.lt-care-row)');
    if (mark) select(mark.classList.contains('is-selected') ? null : mark.dataset.zone);
  });

  scope.on(root, 'keydown', event => {
    const shape = event.target.closest('svg .lt-cz');
    if (shape && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); select(shape.dataset.zone); }
  });

  setView('side');
}

/** Historial de mantenimiento: aplica el filtro por elemento del plan con el que se llegó y permite quitarlo. */
export function mountMaintenanceHistory(context) {
  mountLifeShell(context);
  const {root, scope} = context;
  const q = selector => root.querySelector(selector);
  const rows = [...root.querySelectorAll('.lt-maint-row')];
  const count = q('[data-lt-visible-count]');

  const apply = ({item, rule} = {}) => {
    rows.forEach(row => { row.hidden = Boolean(item) && row.dataset.item !== item; });
    const shown = rows.filter(row => !row.hidden).length;
    q('[data-history-filter]').hidden = !item;
    q('[data-history-empty]').hidden = shown > 0;
    if (count) count.textContent = item ? `(${shown} / ${shown})` : `(${rows.length} / ${count.dataset.total})`;
    if (item) { q('[data-summary-name]').textContent = item; q('[data-summary-rule]').textContent = rule ?? ''; }
  };

  let origin = {};
  try { origin = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || '{}'); sessionStorage.removeItem(HISTORY_KEY); } catch {}
  apply(origin);
  scope.on(root, 'click', event => { if (event.target.closest('[data-history-clear]')) apply(); });
}
