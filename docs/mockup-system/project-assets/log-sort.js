// Ordenar de las tablas de registros: reordena las filas por data-sort-<clave>.
// «recent»/«oldest» usan data-sort-at (ISO); el resto, un número de mayor a menor con desempate por más reciente.
export function mountLogSort({root, scope}, cardId) {
  const card = root.querySelector('#' + cardId);
  const tbody = card?.querySelector('tbody');
  if (!tbody) return;

  scope.on(card, 'click', event => {
    const item = event.target.closest('[data-lt-sort]');
    if (!item) return;
    const key = item.dataset.ltSort;
    const at = row => row.dataset.sortAt || '';
    const byRecent = (a, b) => at(b).localeCompare(at(a));
    const compare = key === 'recent' ? byRecent
      : key === 'oldest' ? (a, b) => at(a).localeCompare(at(b))
      : (a, b) => Number(b.dataset['sort' + key[0].toUpperCase() + key.slice(1)] || 0) - Number(a.dataset['sort' + key[0].toUpperCase() + key.slice(1)] || 0) || byRecent(a, b);
    [...tbody.rows].sort(compare).forEach(row => tbody.appendChild(row));

    card.querySelectorAll('[data-lt-sort]').forEach(b => b === item ? b.setAttribute('aria-checked', 'true') : b.removeAttribute('aria-checked'));
    const label = item.textContent.trim();
    card.querySelector('[data-lt-sort-label]').textContent = label;
    const trigger = card.querySelector(`[data-lt-toggle="${cardId}-sort"]`);
    trigger.setAttribute('aria-label', `Ordenar por ${label}`);
    trigger.setAttribute('aria-expanded', 'false');
    card.querySelector(`#${cardId}-sort`).hidden = true;
  });
}
