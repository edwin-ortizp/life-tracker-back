@props([
    'name' => null,
    'label',
    'labelExpression' => null,
    'id' => null,
    'options' => [],
    'selected' => null,
    'placeholder' => null,
    'help' => null,
    'error' => null,
    'required' => false,
    'disabled' => false,
    'icon' => null,
])

@php
    $fieldId = $id ?? \App\Support\Ui\FieldIdentity::for($name, $label);
    $message = $error ?? ($name && isset($errors) ? $errors->first($name) : null);
    $describedBy = collect([
        $help ? "{$fieldId}-help" : null,
        $message ? "{$fieldId}-error" : null,
    ])->filter()->implode(' ');
@endphp

{{-- Las opciones admiten grupos: `['Grupo' => [valor => etiqueta]]` genera un <optgroup>. --}}
<div class="md-text-field md-field @if ($icon) md-field--icon @endif @if ($message) md-error @endif">
    @if ($icon)<i class="bi {{ $icon }} md-field__icon" aria-hidden="true"></i>@endif
    <select id="{{ $fieldId }}"
            @if ($name) name="{{ $name }}" @endif
            {{ $attributes->class(['md-field__control', 'md-select']) }}
            @required($required)
            @disabled($disabled)
            @if ($message) aria-invalid="true" @endif
            @if ($describedBy) aria-describedby="{{ $describedBy }}" @endif>
        @if ($placeholder !== null)
            <option value="">{{ $placeholder }}</option>
        @endif
        @foreach ($options as $optionValue => $optionLabel)
            @if (is_array($optionLabel))
                <optgroup label="{{ $optionValue }}">
                    @foreach ($optionLabel as $groupValue => $groupLabel)
                        <option value="{{ $groupValue }}" @selected((string) $groupValue === (string) $selected)>{{ $groupLabel }}</option>
                    @endforeach
                </optgroup>
            @else
                <option value="{{ $optionValue }}" @selected((string) $optionValue === (string) $selected)>{{ $optionLabel }}</option>
            @endif
        @endforeach
        {{ $slot }}
    </select>
    <label for="{{ $fieldId }}" @if($labelExpression) x-text="{{ $labelExpression }}" @endif>{{ $label }}@if ($required)<span aria-hidden="true"> *</span>@endif</label>
    @if ($help)
        <p id="{{ $fieldId }}-help" class="md-supporting-text">{{ $help }}</p>
    @endif
    @if ($message)
        <p id="{{ $fieldId }}-error" class="md-supporting-text" role="alert">{{ $message }}</p>
    @endif
</div>
