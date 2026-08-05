@props([
    'state',
    'title',
    'placement' => 'bottom',
    'describedBy' => null,
])

@php
    abort_unless(in_array($placement, ['bottom', 'side'], true), 500, "Posición de hoja no soportada: {$placement}");

    $headingId = 'sheet-'.\Illuminate\Support\Str::slug($title);
@endphp

<template x-if="{{ $state }}">
    <div>
        <div class="md-sheet-scrim" @click="{{ $state }} = false"></div>
        <div {{ $attributes->class(['md-sheet', 'md-sheet--side' => $placement === 'side']) }}
             role="dialog"
             aria-modal="true"
             aria-labelledby="{{ $headingId }}"
             @if ($describedBy) aria-describedby="{{ $describedBy }}" @endif
             x-md-surface
             @md-surface-close="{{ $state }} = false"
             @click.stop>
            <span class="md-sheet__handle" aria-hidden="true"></span>

            <div class="md-sheet__header">
                <h2 id="{{ $headingId }}" class="md-title-large">{{ $title }}</h2>
                <x-ui.icon-action icon="bi-x-lg" label="Cerrar" x-on:click="{{ $state }} = false" />
            </div>

            <div class="md-sheet__body">{{ $slot }}</div>

            @isset($actions)
                <div class="md-sheet__actions">{{ $actions }}</div>
            @endisset
        </div>
    </div>
</template>
