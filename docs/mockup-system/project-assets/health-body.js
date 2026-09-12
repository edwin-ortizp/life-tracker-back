import {mountLifeShell} from '@project/project-assets/life-shell.js';

const STORE_ZONE = 'lt-health-zone';
const STORE_RANGE = 'lt-health-range';

function store(key, value) {
  try { value === null ? sessionStorage.removeItem(key) : sessionStorage.setItem(key, value); } catch (error) { /* almacenamiento no disponible */ }
}

/**
 * Vista del cuerpo: el mapa y la lista de zonas comparten `data-zone`.
 * Pasar el puntero o el foco por una zona la resalta en ambos; seleccionarla en el
 * mapa abre su detalle; abrirla desde la lista lleva al Registro con esa zona filtrada.
 */
export function mountHealthBody(context) {
  mountLifeShell(context);
  const {root, scope} = context;
  const q = selector => root.querySelector(selector);
  const qa = selector => [...root.querySelectorAll(selector)];
  const byZone = id => qa(`[data-zone="${id}"]`);
  let view = 'front';
  let model = 'male';

  const render = () => {
    // <svg> no expone la propiedad `hidden`: se alterna el atributo directamente.
    qa('[data-body-side]').forEach(svg => svg.toggleAttribute('hidden', svg.dataset.bodySide !== view || svg.dataset.bodyModel !== model));
  };

  const setView = next => {
    view = next;
    render();
    qa('[data-body-view]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.bodyView === next)); button.classList.remove('is-hint'); });
    const caption = q('[data-body-caption]');
    if (caption) caption.textContent = next === 'front' ? 'Vista frontal' : 'Vista posterior';
  };

  // Las vistas se deducen de los trazados del modelo activo: no todos los modelos dibujan todas las zonas.
  const viewsOf = id => [...new Set(qa(`[data-body-model="${model}"] [data-zone="${id}"]`).map(el => el.closest('[data-body-side]').dataset.bodySide))];

  const link = (id, on) => {
    byZone(id).forEach(el => el.classList.toggle('is-linked', on));
    const views = viewsOf(id);
    qa('[data-body-view]').forEach(button => button.classList.toggle('is-hint', on && !views.includes(view) && views.includes(button.dataset.bodyView)));
  };

  const select = (id, {scroll = false} = {}) => {
    qa('.is-selected').forEach(el => el.classList.remove('is-selected'));
    byZone(id).forEach(el => el.classList.add('is-selected'));
    const row = q(`.lt-zone-row[data-zone="${id}"]`);
    const shape = q(`svg [data-zone="${id}"]`);
    const detail = q('[data-body-detail]');
    const label = row?.dataset.label ?? shape?.dataset.label ?? '';
    const count = Number(row?.dataset.count ?? shape?.dataset.count ?? 0);
    detail.hidden = false;
    detail.classList.toggle('is-empty', count === 0);
    detail.querySelector('[data-detail-name]').textContent = label;
    detail.querySelector('[data-detail-meta]').textContent = count === 0
      ? 'Sin eventos en el periodo seleccionado'
      : `${count} ${count === 1 ? 'evento' : 'eventos'} · Último: ${row?.dataset.last ?? ''}`;
    const open = detail.querySelector('[data-zone-open]');
    open.dataset.zoneOpen = id;
    open.hidden = count === 0;
    q('[data-body-hint]').hidden = true;
    if (row && scroll) row.scrollIntoView({block: 'nearest', behavior: 'smooth'});
  };

  const openInRegister = id => {
    const row = q(`.lt-zone-row[data-zone="${id}"]`);
    const label = row?.dataset.label ?? q(`svg [data-zone="${id}"]`)?.dataset.label;
    if (!label) return;
    store(STORE_ZONE, label);
    const range = q('[data-filter="range"] [data-filter-label]');
    store(STORE_RANGE, range ? range.textContent.trim() : null);
    window.location.hash = '#/health-index';
  };

  const closeMenu = element => {
    const menu = element.closest('.lt-menu');
    if (!menu) return;
    menu.hidden = true;
    root.querySelector(`[data-lt-toggle="${menu.id}"]`)?.setAttribute('aria-expanded', 'false');
  };

  scope.on(root, 'pointerover', event => { const el = event.target.closest('[data-zone]'); if (el) link(el.dataset.zone, true); });
  scope.on(root, 'pointerout', event => { const el = event.target.closest('[data-zone]'); if (el && !el.contains(event.relatedTarget)) link(el.dataset.zone, false); });
  scope.on(root, 'focusin', event => { const el = event.target.closest('[data-zone]'); if (el) link(el.dataset.zone, true); });
  scope.on(root, 'focusout', event => { const el = event.target.closest('[data-zone]'); if (el) link(el.dataset.zone, false); });

  scope.on(root, 'click', event => {
    const modelToggle = event.target.closest('[data-body-model-toggle]');
    if (modelToggle) {
      model = modelToggle.dataset.bodyModelToggle;
      qa('[data-body-model-toggle]').forEach(button => button.setAttribute('aria-pressed', String(button === modelToggle)));
      render();
      return;
    }
    const toggle = event.target.closest('[data-body-view]');
    if (toggle) { setView(toggle.dataset.bodyView); return; }
    const locate = event.target.closest('[data-zone-locate]');
    if (locate) {
      const id = locate.dataset.zoneLocate;
      const views = viewsOf(id);
      if (!views.includes(view)) setView(views[0]);
      closeMenu(locate);
      select(id);
      byZone(id).forEach(el => { el.classList.remove('is-pulse'); void el.getBoundingClientRect(); el.classList.add('is-pulse'); });
      return;
    }
    const open = event.target.closest('[data-zone-open]');
    if (open) { closeMenu(open); openInRegister(open.dataset.zoneOpen); return; }
    const shape = event.target.closest('svg [data-zone]');
    if (shape) select(shape.dataset.zone, {scroll: true});
  });

  scope.on(root, 'keydown', event => {
    const shape = event.target.closest('svg [data-zone]');
    if (shape && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); select(shape.dataset.zone, {scroll: true}); }
  });

  setView('front');
}
