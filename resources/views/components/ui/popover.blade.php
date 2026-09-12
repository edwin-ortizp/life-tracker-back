@props([
    'state',
    'title',
    'id' => null,
])

@php
    $popoverId = $id ?? 'popover-'.\Illuminate\Support\Str::slug($title);
@endphp

{{--
    Superficie anclada a su contenedor (que debe ser `position: relative`).
    El disparador declara `data-popover-trigger` para que su propio clic no la cierre.
--}}
<div {{ $attributes->class(['md-popover']) }}
     id="{{ $popoverId }}"
     role="dialog"
     aria-labelledby="{{ $popoverId }}-title"
     x-cloak
     x-show="{{ $state }}"
     x-transition.opacity.duration.120ms
     @click.outside="if (! $event.target.closest('[data-popover-trigger]')) {{ $state }} = false"
     @keydown.escape.stop="{{ $state }} = false">
    <header class="md-popover__head">
        <h3 id="{{ $popoverId }}-title" class="md-popover__title">{{ $title }}</h3>
        <button type="button" class="md-btn-icon md-btn--sm" aria-label="Cerrar {{ \Illuminate\Support\Str::lower($title) }}" title="Cerrar" @click="{{ $state }} = false">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
        </button>
    </header>
    <div class="md-popover__body">{{ $slot }}</div>
    @isset($actions)
        <footer class="md-popover__actions">{{ $actions }}</footer>
    @endisset
</div>
