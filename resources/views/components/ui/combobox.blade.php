@props([
    'name' => null,
    'label',
    'id' => null,
    'options' => [],
    'placeholder' => 'Buscar',
    'empty' => 'Sin resultados',
    'help' => null,
    'error' => null,
])

{{-- Select con buscador: filtra sin distinguir mayúsculas ni tildes y enlaza el valor con `wire:model`. --}}
@php
    $fieldId = $id ?? \App\Support\Ui\FieldIdentity::for($name, $label);
    $model = $attributes->wire('model')->value();
    $message = $error ?? ($name && isset($errors) ? $errors->first($name) : null);
    $items = collect($options)->map(fn ($text, $value) => ['value' => (string) $value, 'label' => (string) $text])->values();
@endphp

<div class="md-text-field md-field md-combobox @if ($message) md-error @endif"
     x-data="{
         value: {!! $model ? "\$wire.entangle('{$model}')" : "''" !!},
         options: @js($items),
         term: '',
         open: false,
         active: -1,
         normalize: text => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase(),
         get filtered() { const term = this.normalize(this.term.trim()); return this.options.filter(option => this.normalize(option.label).includes(term)); },
         labelFor(value) { return this.options.find(option => option.value === String(value ?? ''))?.label ?? ''; },
         show() { this.term = ''; this.open = true; this.active = -1; },
         choose(option) { this.value = option.value; this.term = option.label; this.open = false; },
         close() { this.open = false; this.term = this.labelFor(this.value); },
         move(step) { const count = this.filtered.length; if (! count) return; this.open = true; this.active = (this.active + step + count) % count; this.$nextTick(() => this.$refs.list.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' })); },
     }"
     x-init="term = labelFor(value); $watch('value', value => { if (! open) term = labelFor(value) })"
     x-on:click.outside="close()">
    <input type="text" id="{{ $fieldId }}" role="combobox" autocomplete="off" placeholder=" "
           class="md-field__control" aria-autocomplete="list" aria-controls="{{ $fieldId }}-list"
           x-bind:aria-expanded="open" x-model="term"
           x-on:focus="show()" x-on:input="open = true; active = -1"
           x-on:keydown.arrow-down.prevent="move(1)" x-on:keydown.arrow-up.prevent="move(-1)"
           x-on:keydown.enter="if (open && filtered[active]) { $event.preventDefault(); choose(filtered[active]) }"
           x-on:keydown.escape="if (open) { $event.stopPropagation(); close() }"
           x-on:keydown.tab="close()"
           @if ($message) aria-invalid="true" aria-describedby="{{ $fieldId }}-error" @endif>
    <label for="{{ $fieldId }}">{{ $label }}</label>
    <i class="bi bi-chevron-down md-combobox__chevron" aria-hidden="true"></i>
    <ul id="{{ $fieldId }}-list" role="listbox" class="md-combobox__list" x-ref="list" x-show="open" x-cloak x-on:mousedown.prevent>
        <li role="option" x-on:click="choose({ value: '', label: '' })" class="md-combobox__option md-combobox__option--muted" x-show="term === ''" aria-selected="false">{{ $placeholder }}</li>
        <template x-for="(option, index) in filtered" :key="option.value">
            <li role="option" class="md-combobox__option" x-text="option.label"
                x-bind:class="{ 'is-active': index === active, 'is-selected': option.value === String(value ?? '') }"
                x-bind:aria-selected="option.value === String(value ?? '')"
                x-on:click="choose(option)"></li>
        </template>
        <li class="md-combobox__empty" x-show="filtered.length === 0">{{ $empty }}</li>
    </ul>
    @if ($help)<p class="md-supporting-text">{{ $help }}</p>@endif
    @if ($message)<p id="{{ $fieldId }}-error" class="md-supporting-text" role="alert">{{ $message }}</p>@endif
</div>
