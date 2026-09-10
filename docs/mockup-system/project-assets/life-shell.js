export function mountLifeShell({root, scope, toast}) {
  const compact = () => window.matchMedia('(max-width: 767.98px)').matches;
  scope.on(root, 'click', event => {
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
  scope.on(window, 'keydown', event => { if (event.key === 'Escape') root.querySelector('.lt-shell')?.classList.remove('is-drawer-open'); });
}
