<div class="md-card-elevated h-100">
    <div class="d-flex align-items-center gap-2 mb-2">
        <h2 class="md-title-small mb-0" style="color: var(--md-sys-color-on-surface);">
            <i class="bi bi-egg-fried" style="color: var(--md-sys-color-tertiary);"></i> Comidas de hoy
        </h2>
        <a href="{{ route('meals.weekly', ['date' => $selectedDate]) }}" class="md-btn-text ms-auto" style="height: 32px; padding: 0 10px;">Ver semana</a>
    </div>

    @forelse ($meals as $meal)
        <div class="d-flex align-items-center gap-2 py-1" wire:key="home-meal-{{ $meal->id }}">
            <span class="md-chip-tonal" style="min-width: 92px; justify-content: center;">{{ $mealTypes[$meal->meal_type] ?? ucfirst($meal->meal_type) }}</span>
            <span class="md-body-small flex-grow-1" style="color: var(--md-sys-color-on-surface);">{{ $meal->items->map(fn ($item) => $item->recipe?->name ?? $item->name)->filter()->implode(' + ') }}</span>
            @if ($meal->effective_calories > 0)
                <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">{{ number_format($meal->effective_calories) }} kcal</span>
            @endif
        </div>
    @empty
        <p class="md-body-small mb-0" style="color: var(--md-sys-color-on-surface-variant);">
            No hay comidas planificadas para este día.
            <a href="{{ route('meals.weekly', ['date' => $selectedDate]) }}">Planificar menú</a>
        </p>
    @endforelse
</div>
