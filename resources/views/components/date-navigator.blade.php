@props(['date', 'previous' => 'previousDay', 'next' => 'nextDay', 'today' => 'today', 'format' => 'D d M Y'])

<div class="md-date-navigator" aria-label="Navegación por fecha">
    <button type="button" wire:click="{{ $previous }}" class="md-btn-icon" title="Día anterior" aria-label="Día anterior"><i class="bi bi-chevron-left"></i></button>
    <button type="button" wire:click="{{ $today }}" class="md-date-navigator__today">Hoy</button>
    <time datetime="{{ \Carbon\Carbon::parse($date)->toDateString() }}" class="md-date-navigator__label">
        {{ \Carbon\Carbon::parse($date)->translatedFormat($format) }}
    </time>
    <button type="button" wire:click="{{ $next }}" class="md-btn-icon" title="Día siguiente" aria-label="Día siguiente"><i class="bi bi-chevron-right"></i></button>
</div>
