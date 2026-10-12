import {startMockup} from '@mockup-system/runtime/bootstrap.js';
import {mountLifeShell} from '@project/project-assets/life-shell.js';
function mountMcp(context) {
  mountLifeShell(context);
  const {root, scope} = context;
  const search = root.querySelector('#mcp-tools .lt-mcard__search input');
  const module = root.querySelector('[data-mcp-module]');
  const rows = [...root.querySelectorAll('#mcp-tools tbody tr')];
  let kind = '';
  const apply = () => {
    const text = search.value.trim().toLowerCase();
    let visible = 0;
    rows.forEach(row => {
      row.hidden = (text && !row.dataset.search.includes(text)) || (kind && row.dataset.kind !== kind) || (module.value && row.dataset.module !== module.value);
      if (!row.hidden) visible++;
    });
    root.querySelector('#mcp-tools [data-lt-visible-count]').textContent = `(${visible} / ${rows.length})`;
    root.querySelector('[data-mcp-empty]').hidden = visible > 0;
    const active = (kind ? 1 : 0) + (module.value ? 1 : 0);
    const badge = root.querySelector('#mcp-tools [data-lt-filter-count]');
    badge.textContent = active; badge.hidden = active === 0;
  };
  const setKind = value => {
    kind = value;
    root.querySelectorAll('[data-mcp-kind]').forEach(chip => { const on = chip.dataset.mcpKind === value; chip.classList.toggle('is-selected', on); chip.setAttribute('aria-pressed', String(on)); });
  };
  scope.on(search, 'input', apply);
  scope.on(module, 'change', apply);
  scope.on(root, 'click', event => {
    const detail = event.target.closest('[data-mcp-detail]');
    if (detail) {
      const row = detail.closest('tr');
      const modal = root.querySelector('#mcp-tool-detail');
      const set = (key, value) => { modal.querySelector(`[data-mcp-d="${key}"]`).textContent = value; };
      set('name', detail.textContent); set('module', row.dataset.moduleLabel); set('class', row.dataset.class); set('description', row.dataset.description);
      const read = row.dataset.kind === 'read';
      const kindChip = modal.querySelector('[data-mcp-d="kind"]');
      kindChip.textContent = read ? 'Lectura' : 'Escritura';
      kindChip.className = `lt-chip ${read ? 'lt-chip--info' : 'lt-chip--warning'}`;
      return;
    }
    const chip = event.target.closest('[data-mcp-kind]');
    if (chip) { setKind(chip.dataset.mcpKind); apply(); return; }
    if (event.target.closest('[data-mcp-clear]')) { setKind(''); module.value = ''; search.value = ''; apply(); }
  });
}
startMockup({'settings-profile': mountLifeShell, 'settings-body': mountLifeShell, 'settings-security': mountLifeShell, 'settings-oauth': mountLifeShell, 'settings-integrations': mountLifeShell, 'settings-mcp': mountMcp, 'settings-about': mountLifeShell});
