import {mountLifeShell} from '@project/project-assets/life-shell.js';

const TONES = ['over', 'soon', 'ok', 'none'];

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
    q('[data-care-filter]').hidden = !id;
    q('[data-care-empty]').hidden = shown.length > 0;
    q('[data-car-hint]').hidden = Boolean(id);
    detail.hidden = !id;
    if (!id) return;

    const marks = qa(`[data-zone="${id}"]:not(.lt-care-row)`);
    marks.forEach(el => el.classList.add('is-selected'));
    const views = viewsOf(id);
    if (views.length && !views.includes(view)) setView(views[0]);

    const label = marks[0]?.dataset.label ?? '';
    const count = `${shown.length} ${shown.length === 1 ? 'plan' : 'planes'}`;
    const urgent = shown[0];
    q('[data-care-filter-label]').textContent = `${label} · ${count}`;
    TONES.forEach(tone => detail.classList.toggle(`lt-tone-${tone}`, tone === (urgent ? toneOf(urgent) : 'none')));
    detail.querySelector('[data-detail-name]').textContent = label;
    detail.querySelector('[data-detail-meta]').textContent = urgent
      ? `${count} · Más urgente: ${urgent.querySelector('strong').textContent} (${urgent.querySelector('.lt-list-item__body > span').textContent})`
      : 'Sin planes de mantenimiento para esta zona';
  };

  scope.on(root, 'pointerover', event => { const el = event.target.closest('[data-zone]'); if (el) link(el.dataset.zone, true); });
  scope.on(root, 'pointerout', event => { const el = event.target.closest('[data-zone]'); if (el && !el.contains(event.relatedTarget)) link(el.dataset.zone, false); });
  scope.on(root, 'focusin', event => { const el = event.target.closest('[data-zone]'); if (el) link(el.dataset.zone, true); });
  scope.on(root, 'focusout', event => { const el = event.target.closest('[data-zone]'); if (el) link(el.dataset.zone, false); });

  scope.on(root, 'click', event => {
    const toggle = event.target.closest('[data-car-view]');
    if (toggle) { setView(toggle.dataset.carView); return; }
    if (event.target.closest('[data-care-clear]')) { select(null); return; }
    const mark = event.target.closest('[data-zone]:not(.lt-care-row)');
    if (mark) select(mark.classList.contains('is-selected') ? null : mark.dataset.zone);
  });

  scope.on(root, 'keydown', event => {
    const shape = event.target.closest('svg .lt-cz');
    if (shape && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); select(shape.dataset.zone); }
  });

  setView('side');
}
