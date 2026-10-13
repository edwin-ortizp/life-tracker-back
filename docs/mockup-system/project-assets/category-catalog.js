export function mountCategoryCatalog({root, scope}) {
  const host = root.querySelector('[data-category-catalog]');
  if (!host) return;
  const names = JSON.parse(host.dataset.categoryNames);
  const storageKey = `lt-category-demo-${host.dataset.categoryCatalog}`;
  let items = [{id:'1',name:names[0],parent:''},{id:'2',name:names[1],parent:''},{id:'3',name:names[2],parent:'2'}];
  try { items = JSON.parse(sessionStorage.getItem(storageKey)) || items; } catch { /* demo sin almacenamiento */ }
  let editing = null;
  let returnFocus = null;
  const modal = host.querySelector('#category-editor');
  const input = host.querySelector('[data-category-input]');
  const parentInput = host.querySelector('[data-category-parent-input]');
  const error = host.querySelector('[data-category-error]');
  const message = host.querySelector('[data-category-message]');
  const path = item => item.parent ? `${items.find(i => i.id === item.parent)?.name} / ${item.name}` : item.name;
  function render() {
    const body = host.querySelector('[data-category-rows]');
    body.replaceChildren();
    const query = host.querySelector('.lt-mcard__search input')?.value.toLocaleLowerCase() || '';
    for (const parent of items.filter(i => !i.parent)) {
      for (const item of [parent, ...items.filter(i => i.parent === parent.id)]) {
        const template = host.querySelector('[data-category-row]');
        const row = template.content.firstElementChild.cloneNode(true);
        row.querySelectorAll('*').forEach(node => [...node.attributes].forEach(attr => { if (attr.value.includes('ROW')) node.setAttribute(attr.name, attr.value.replaceAll('ROW',item.id)); }));
        row.querySelector('[data-category-name]').textContent = (item.parent ? '↳ ' : '') + item.name;
        row.querySelector('[data-category-parent]').textContent = item.parent ? parent.name : 'Sin padre';
        row.hidden = !path(item).toLocaleLowerCase().includes(query);
        body.append(row);
      }
    }
    try { sessionStorage.setItem(storageKey, JSON.stringify(items)); } catch { /* demo sin almacenamiento */ }
  }
  function open(item = null) {
    editing = item;
    error.hidden = true;
    input.value = item?.name || '';
    parentInput.replaceChildren(new Option('Sin padre',''));
    items.filter(i => !i.parent && i !== item).forEach(i => parentInput.add(new Option(i.name,i.id)));
    parentInput.value = item?.parent || '';
    parentInput.disabled = Boolean(item && items.some(i => i.parent === item.id));
    modal.hidden = false;
    input.focus();
  }
  scope.on(host,'input',event => { if (event.target.matches('.lt-mcard__search input')) render(); });
  scope.on(host,'click',event => {
    const action = event.target.closest('[data-lt-action]')?.dataset.ltAction;
    if (action?.startsWith('category-') || event.target.closest('.lt-fab')) event.stopPropagation();
    if (event.target.closest('.lt-fab')) { returnFocus = event.target.closest('.lt-fab'); open(); }
    if (action?.startsWith('category-edit-')) { returnFocus = event.target.closest('button'); open(items.find(i => i.id === action.slice('category-edit-'.length))); }
    if (action?.startsWith('category-delete-')) {
      const id = action.slice('category-delete-'.length);
      if (items.some(i => i.parent === id)) { message.textContent = 'Mueve primero las subcategorías antes de eliminar esta categoría.'; return; }
      items = items.filter(i => i.id !== id);
      message.textContent = 'Categoría eliminada.';
      render();
    }
    if (action === 'category-save') {
      const name = input.value.trim();
      const parent = parentInput.value;
      if (!name || items.some(i => i !== editing && i.name.toLocaleLowerCase() === name.toLocaleLowerCase()) ||
          (parent && (!items.some(i => i.id === parent && !i.parent) || items.some(i => i.parent === editing?.id)))) {
        error.textContent = 'Escribe un nombre único y elige una categoría raíz. Solo se permiten dos niveles.';
        error.hidden = false;
        return;
      }
      if (editing) Object.assign(editing,{name,parent});
      else items.push({id:crypto.randomUUID(),name,parent});
      modal.hidden = true;
      returnFocus?.focus();
      message.textContent = 'Categoría guardada.';
      render();
    }
  });
  scope.on(host,'keydown',event => {
    if (modal.hidden) return;
    if (event.key === 'Escape') { event.stopPropagation(); modal.hidden = true; returnFocus?.focus(); }
    if (event.key === 'Tab') {
      const controls = [...modal.querySelectorAll('.lt-dialog button:not([disabled]), .lt-dialog input, .lt-dialog select:not([disabled])')].filter(node => node.offsetParent !== null);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  render();
}
