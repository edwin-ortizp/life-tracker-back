@props([
    'name',
    'label',
    'help' => null,
    'checked' => false,
    'disabled' => false,
])

@php
    $id = $attributes->get('id') ?? 'switch-'.\Illuminate\Support\Str::slug($name);
    $helpId = $help ? $id.'-help' : null;
@endphp

{{-- Interruptor de encendido/apagado para preferencias de efecto inmediato. Usa un checkbox nativo con role="switch". --}}
<label class="md-switch" for="{{ $id }}">
    <input type="checkbox" role="switch" id="{{ $id }}" name="{{ $name }}"
           {{ $attributes->except('id') }}
           @checked($checked) @disabled($disabled)
           @if ($helpId) aria-describedby="{{ $helpId }}" @endif>
    <span class="md-switch__track" aria-hidden="true"><span class="md-switch__thumb"></span></span>
    <span class="md-switch__text">
        <span class="md-body-medium">{{ $label }}</span>
        @if ($help)<span id="{{ $helpId }}" class="md-supporting-text">{{ $help }}</span>@endif
    </span>
</label>
