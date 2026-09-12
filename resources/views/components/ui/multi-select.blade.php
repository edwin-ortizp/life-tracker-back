@props([
    'name',
    'label',
    'options' => [],
    'allLabel' => 'Todos',
    'id' => null,
    'icon' => null,
])

@php
    $fieldId = $id ?? \App\Support\Ui\FieldIdentity::for($name, $label);
@endphp

{{-- Selección múltiple con checkboxes, enlazada a una propiedad array de Livewire. --}}
<div {{ $attributes->class(['md-text-field', 'md-field', 'md-multi-select', 'md-field--icon' => $icon]) }}
     x-data="{ open: false, selected: $wire.entangle('{{ $name }}').live, labels: @js($options) }"
     @click.outside="open = false"
     @keydown.escape.stop="if (open) { open = false; $refs.trigger.focus() }">
    @if ($icon)<i class="bi {{ $icon }} md-field__icon" aria-hidden="true"></i>@endif
    <button type="button"
            id="{{ $fieldId }}"
            x-ref="trigger"
            class="md-field__control md-multi-select__trigger"
            aria-haspopup="listbox"
            :aria-expanded="open.toString()"
            @click="open = !open">
        <span class="md-multi-select__value" x-text="selected.length ? selected.map((value) => labels[value] ?? value).join(', ') : @js($allLabel)">{{ $allLabel }}</span>
    </button>
    <label for="{{ $fieldId }}">{{ $label }}</label>
    <div class="md-multi-select__panel" role="listbox" aria-multiselectable="true" aria-label="{{ $label }}" x-cloak x-show="open">
        @foreach ($options as $optionValue => $optionLabel)
            <span class="md-multi-select__option" role="option" :aria-selected="selected.includes(@js((string) $optionValue)).toString()">
                <input type="checkbox" id="{{ $fieldId }}-{{ $optionValue }}" value="{{ $optionValue }}" x-model="selected">
                <span><label class="md-multi-select__option-label" for="{{ $fieldId }}-{{ $optionValue }}">{{ $optionLabel }}</label></span>
            </span>
        @endforeach
    </div>
</div>
