@props([
    'state',
    'title',
    'size' => 'md',
    'icon' => null,
    'describedBy' => null,
])

@php
    $sizes = ['md', 'lg', 'fullscreen'];

    abort_unless(in_array($size, $sizes, true), 500, "Tamaño de diálogo no soportado: {$size}");

    $headingId = 'dialog-'.\Illuminate\Support\Str::slug($title);
    $surfaceClasses = [
        'md-dialog',
        'md-dialog--large' => $size === 'lg',
        'md-dialog-fullscreen' => $size === 'fullscreen',
    ];
@endphp

@if ($size !== 'md') @teleport('body') @endif
<template x-if="{{ $state }}">
    <div @if ($size !== 'md') data-module="{{ \App\Support\Ui\ModuleContext::current() }}" @endif>
        <div class="md-dialog-scrim" @click="{{ $state }} = false"></div>
        <div {{ $attributes->class($surfaceClasses) }}
             @if ($size !== 'md') x-dialog-viewport @endif
             role="dialog"
             aria-modal="true"
             aria-labelledby="{{ $headingId }}"
             @if ($describedBy) aria-describedby="{{ $describedBy }}" @endif
             x-md-surface
             @md-surface-close="{{ $state }} = false"
             @click.stop>
            @if ($size !== 'md') <header class="md-dialog-responsive-head"> @endif
            @if ($icon)
                <div class="md-dialog-icon"><i class="bi {{ $icon }}" aria-hidden="true"></i></div>
            @endif

            <h2 id="{{ $headingId }}" class="md-dialog-headline md-headline-small">{{ $title }}</h2>
            @if ($size !== 'md')
                <button type="button" class="md-btn-icon md-dialog-mobile-close" aria-label="Cerrar" @click="$dispatch('md-surface-close')"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
                </header>
            @endif

            <div class="md-dialog-content">{{ $slot }}</div>

            @isset($actions)
                <div class="md-dialog-actions">{{ $actions }}</div>
            @endisset
        </div>
    </div>
</template>
@if ($size !== 'md') @endteleport @endif
