@props(['name', 'value' => 'bi-tag', 'options' => []])
<div class="plan-icon-picker" x-data="{ query: '', selected: $wire.entangle(@js($name)), icons: @js($options), get matches() { const aliases = {corazon:'heart', calendario:'calendar', personas:'people', naturaleza:'tree', etiqueta:'tag', categoria:'grid', comida:'egg'}; const q = this.query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); return Object.entries(this.icons).filter(([key, label]) => (key + ' ' + label).includes(aliases[q] || q)); } }">
    <x-ui.field :name="$name.'Search'" label="Buscar icono" type="search" x-model="query" x-on:keydown.arrow-down.prevent="$refs.results.querySelector('button')?.focus()" placeholder="Buscar: corazón, calendar, tree…" />
    <p>Icono seleccionado: <i :class="'bi ' + selected" aria-hidden="true"></i> <span x-text="icons[selected] || selected"></span></p>
    <div class="plan-icon-picker__results" x-ref="results" role="group" aria-label="Iconos disponibles">
        <template x-for="[key, label] in matches.slice(0,60)" :key="key"><button type="button" class="md-btn-icon" :aria-label="label" :title="label" :aria-pressed="selected === key" x-on:click="selected = key"><i :class="'bi ' + key" aria-hidden="true"></i></button></template>
    </div>
    <p role="status" x-text="matches.length ? matches.length + ' iconos encontrados' + (matches.length > 60 ? '; se muestran 60. Afina la búsqueda.' : '.') : 'No se encontraron iconos.'"></p>
    @error($name)<p class="md-supporting-text" role="alert">{{ $message }}</p>@enderror
</div>
