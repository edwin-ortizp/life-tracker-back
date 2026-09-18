// Ordenar de las management cards: actualiza el menú y, si las filas traen data-sort-*, las reordena.
// «recent»/«oldest» usan data-sort-at (ISO); el resto, data-sort-<clave> numérico de mayor a menor con desempate por más reciente.
// Filas: hijos de [data-lt-sort-rows] o, si no existe, del tbody. Sin atributos de orden solo cambia la etiqueta.
export function mountLogSort({root, scope}, cardId) {
  const card = root.querySelector('#' + cardId);
  if (!card) return;

  scope.on(card, 'click', event => {
    const item = event.target.closest('[data-lt-sort]');
    if (!item) return;
    const key = item.dataset.ltSort;
    const container = card.querySelector('[data-lt-sort-rows]') || card.querySelector('tbody');
    const rows = container ? [...container.children].filter(row => row.dataset.sortAt) : [];
    if (rows.length) {
      const at = row => row.dataset.sortAt;
      const value = row => Number(row.dataset['sort' + key[0].toUpperCase() + key.slice(1)] || 0);
      const byRecent = (a, b) => at(b).localeCompare(at(a));
      const compare = key === 'recent' ? byRecent
        : key === 'oldest' ? (a, b) => at(a).localeCompare(at(b))
        : (a, b) => value(b) - value(a) || byRecent(a, b);
      rows.sort(compare).forEach(row => container.appendChild(row));
    }

    card.querySelectorAll('[data-lt-sort]').forEach(b => b === item ? b.setAttribute('aria-checked', 'true') : b.removeAttribute('aria-checked'));
    const label = item.textContent.trim();
    card.querySelector('[data-lt-sort-label]').textContent = label;
    const trigger = card.querySelector(`[data-lt-toggle="${cardId}-sort"]`);
    trigger.setAttribute('aria-label', `Ordenar por ${label}`);
    trigger.setAttribute('aria-expanded', 'false');
    card.querySelector(`#${cardId}-sort`).hidden = true;
  });
}
