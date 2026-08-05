@props([
    'name',
    'tone' => 'inherit',
    'label' => null,
])

@php
    $tones = ['inherit', 'muted', 'primary', 'success', 'warning', 'danger', 'info'];

    abort_unless(in_array($tone, $tones, true), 500, "Tono de icono no soportado: {$tone}");
@endphp

<i {{ $attributes->class(['bi', $name, 'md-icon--'.$tone => $tone !== 'inherit']) }}
   @if ($label) role="img" aria-label="{{ $label }}" @else aria-hidden="true" @endif></i>
