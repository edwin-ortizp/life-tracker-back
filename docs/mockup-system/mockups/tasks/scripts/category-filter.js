export function mountTaskCategoryFilter({root,scope,params}) {
  const panel = root.querySelector('#tasks-category-options');
  if (!panel) return;
  const boxes = [...panel.querySelectorAll('input[type="checkbox"]')];
  const selection = params.getAll('category[]').concat(params.getAll('category'));
  boxes.forEach(box => { box.checked = selection.includes(box.value); });
  function refresh(writeUrl = true) {
    const selected = boxes.filter(box => box.checked).map(box => box.value);
    const expanded = new Set(selected.concat(selected.includes('work') ? ['projects'] : []));
    const rows = [...root.querySelectorAll('[data-task-category]')];
    rows.forEach(row => { row.hidden = selected.length > 0 && !expanded.has(row.dataset.taskCategory); });
    root.querySelector('[data-lt-toggle="tasks-category-options"] span').textContent = selected.length
      ? boxes.filter(box => box.checked).map(box => box.parentElement.textContent.trim()).join(', ') : 'Todas las categorías';
    const count = rows.filter(row => !row.hidden).length;
    root.querySelector('[data-lt-visible-count]').textContent = `(${count} / ${rows.length})`;
    const badge = root.querySelector('[data-lt-filter-count]');
    badge.textContent = selected.length ? '1' : '0'; badge.hidden = !selected.length;
    if (writeUrl) {
      const url = new URL(location.href);
      const [route,query = ''] = url.hash.split('?');
      const next = new URLSearchParams(query);
      next.delete('category'); next.delete('category[]');
      selected.forEach(value => next.append('category[]',value));
      url.hash = route + (next.size ? '?' + next : '');
      history.pushState(null,'',url);
    }
  }
  scope.on(panel,'change',() => refresh());
  scope.on(panel,'keydown',event => {
    if (event.key === 'Escape') {
      event.stopPropagation(); panel.hidden = true;
      const trigger = root.querySelector('[data-lt-toggle="tasks-category-options"]');
      trigger.setAttribute('aria-expanded','false'); trigger.focus();
    }
  });
  scope.on(panel,'input',event => {
    if (event.target.type !== 'search') return;
    const query = event.target.value.toLocaleLowerCase();
    panel.querySelectorAll('.lt-multiselect__option').forEach(option => { option.hidden = !option.textContent.toLocaleLowerCase().includes(query); });
  });
  scope.on(root,'click',event => {
    if (event.target.closest('[data-task-category-clear]')) { boxes.forEach(box => { box.checked = false; }); refresh(); }
  });
  refresh(false);
}
