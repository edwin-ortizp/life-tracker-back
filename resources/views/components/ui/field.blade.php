@props([
    'name' => null,
    'label',
    'type' => 'text',
    'id' => null,
    'value' => null,
    'help' => null,
    'error' => null,
    'required' => false,
    'disabled' => false,
])

@php
    $fieldId = $id ?? \App\Support\Ui\FieldIdentity::for($name, $label);
    $message = $error ?? ($name && isset($errors) ? $errors->first($name) : null);
    $describedBy = collect([
        $help ? "{$fieldId}-help" : null,
        $message ? "{$fieldId}-error" : null,
    ])->filter()->implode(' ');
@endphp

<div class="md-text-field md-field @if ($message) md-error @endif">
    <input type="{{ $type }}"
           id="{{ $fieldId }}"
           @if ($name) name="{{ $name }}" @endif
           value="{{ $value }}"
           placeholder=" "
           {{ $attributes->class(['md-field__control']) }}
           @required($required)
           @disabled($disabled)
           @if ($message) aria-invalid="true" @endif
           @if ($describedBy) aria-describedby="{{ $describedBy }}" @endif>
    <label for="{{ $fieldId }}">{{ $label }}@if ($required)<span aria-hidden="true"> *</span>@endif</label>
    @if ($help)
        <p id="{{ $fieldId }}-help" class="md-supporting-text">{{ $help }}</p>
    @endif
    @if ($message)
        <p id="{{ $fieldId }}-error" class="md-supporting-text" role="alert">{{ $message }}</p>
    @endif
</div>
