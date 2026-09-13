@props([
    'name',
    'live' => true,
    'label',
    'labelExpression' => null,
    'modelExpression' => null,
    'options' => [],
    'allLabel' => 'Todos',
    'id' => null,
    'icon' => null,
    'error' => null,
])

@php
    $fieldId = $id ?? \App\Support\Ui\FieldIdentity::for($name, $label);
    $message = $error ?? (isset($errors) ? $errors->first($name) : null);
    // Las opciones admiten grupos: `['Grupo' => [valor => etiqueta]]`.
    $groups = collect($options)->every(fn ($option) => is_array($option)) && $options !== [] ? $options : ['' => $options];
    $labels = collect($groups)->flatMap(fn ($group) => $group)->all();
@endphp

{{-- Selección múltiple con checkboxes, enlazada a una propiedad array de Livewire. --}}
<div {{ $attributes->class(['md-text-field', 'md-field', 'md-multi-select', 'md-field--icon' => $icon, 'md-error' => $message]) }}
     x-data="{ open: false, @if($modelExpression) get selected() { return {{ $modelExpression }} }, set selected(value) { {{ $modelExpression }} = value }, @else selected: $wire.entangle('{{ $name }}'){{ $live ? '.live' : '' }}, @endif labels: @js($labels) }"
     @click.outside="open = false"
     @keydown.escape.stop="if (open) { open = false; $refs.trigger.focus() }">
    @if ($icon)<i class="bi {{ $icon }} md-field__icon" aria-hidden="true"></i>@endif
    <button type="button"
            id="{{ $fieldId }}"
            x-ref="trigger"
            class="md-field__control md-multi-select__trigger"
            aria-haspopup="listbox"
            :aria-expanded="open.toString()"
            @if ($message) aria-invalid="true" aria-describedby="{{ $fieldId }}-error" @endif
            @click="open = !open">
        <span class="md-multi-select__value"
              x-text="selected.length ? selected.slice(0, 2).map((value) => labels[value] ?? value).join(', ') + (selected.length > 2 ? ' +' + (selected.length - 2) : '') : @js($allLabel)">{{ $allLabel }}</span>
    </button>
    <label for="{{ $fieldId }}" @if($labelExpression) x-text="{{ $labelExpression }}" @endif>{{ $label }}</label>
    <div class="md-multi-select__panel" role="listbox" aria-multiselectable="true" aria-label="{{ $label }}" x-cloak x-show="open">
        @foreach ($groups as $groupLabel => $groupOptions)
            @if ($groupLabel !== '')
                <span class="md-multi-select__group" role="presentation">{{ $groupLabel }}</span>
            @endif
            @foreach ($groupOptions as $optionValue => $optionLabel)
                <span class="md-multi-select__option" role="option" :aria-selected="selected.includes(@js((string) $optionValue)).toString()">
                    <input type="checkbox" id="{{ $fieldId }}-{{ $optionValue }}" value="{{ $optionValue }}" x-model="selected">
                    <span><label class="md-multi-select__option-label" for="{{ $fieldId }}-{{ $optionValue }}">{{ $optionLabel }}</label></span>
                </span>
            @endforeach
        @endforeach
    </div>
    @if ($message)
        <p id="{{ $fieldId }}-error" class="md-supporting-text" role="alert">{{ $message }}</p>
    @endif
</div>
