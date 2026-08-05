<div class="md-relationship-event {{ $event->is_archived ? 'md-relationship-event--archived' : '' }}" wire:key="event-{{ $event->id }}">
    <div class="md-relationship-event__body">
        <div class="md-title-small">
            {{ $event->title }}
            @if ($event->is_sensitive)
                <span class="md-chip-tonal md-chip-tonal--warning"><i class="bi bi-eye-slash" style="font-size: 0.5625rem;"></i> Sensible</span>
            @endif
        </div>
        <div class="d-flex flex-wrap gap-1 mt-1 align-items-center">
            <span class="md-chip-tonal md-chip-tonal--info">{{ $event->categoryLabel() }}</span>
            <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">{{ $event->dateLabel() }}</span>
        </div>
        @if ($event->notes)
            <p class="md-body-small mt-1 mb-0" style="color: var(--md-sys-color-on-surface-variant);">{{ $event->notes }}</p>
        @endif
    </div>
    <div class="d-flex gap-1">
        <button wire:click="openEventForm('{{ $event->id }}')" class="md-btn-icon" title="Editar acontecimiento">
            <i class="bi bi-pencil"></i>
        </button>
        <button wire:click="toggleEventArchive('{{ $event->id }}')" class="md-btn-icon"
                title="{{ $event->is_archived ? 'Desarchivar' : 'Archivar' }}" style="color: var(--md-custom-color-warning);">
            <i class="bi {{ $event->is_archived ? 'bi-archive-fill' : 'bi-archive' }}"></i>
        </button>
        <button wire:click="deleteEvent('{{ $event->id }}')" wire:confirm="¿Eliminar este acontecimiento?"
                class="md-btn-icon" title="Eliminar acontecimiento" style="color: var(--md-sys-color-error);">
            <i class="bi bi-trash"></i>
        </button>
    </div>
</div>
