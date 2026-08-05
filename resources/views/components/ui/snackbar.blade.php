@props([
    'state' => null,
    'tone' => 'neutral',
    'dismissLabel' => 'Cerrar aviso',
])

@php
    abort_unless(in_array($tone, ['neutral', 'danger'], true), 500, "Tono de snackbar no soportado: {$tone}");
@endphp

{{-- La confirmación no es modal: anuncia el cambio sin robar el foco. --}}
@if ($state)
    <template x-if="{{ $state }}">
        <div {{ $attributes->class(['md-snackbar', 'md-snackbar--danger' => $tone === 'danger']) }} role="status" aria-live="polite">
            <p class="md-snackbar__text md-body-medium">{{ $slot }}</p>
            <div class="md-snackbar__actions">
                {{ $actions ?? '' }}
                <x-ui.icon-action icon="bi-x-lg" size="sm" :label="$dismissLabel" x-on:click="{{ $state }} = false" />
            </div>
        </div>
    </template>
@else
    <div {{ $attributes->class(['md-snackbar', 'md-snackbar--danger' => $tone === 'danger']) }} role="status" aria-live="polite">
        <p class="md-snackbar__text md-body-medium">{{ $slot }}</p>
        @isset($actions)
            <div class="md-snackbar__actions">{{ $actions }}</div>
        @endisset
    </div>
@endif
