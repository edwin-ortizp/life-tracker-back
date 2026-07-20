<div class="md-card-elevated h-100">
    <div class="d-flex align-items-center gap-2 mb-2">
        <h2 class="md-title-small mb-0" style="color: var(--md-sys-color-on-surface);">
            <i class="bi bi-check2-square" style="color: var(--md-custom-color-success);"></i> Hábitos
        </h2>
        <span class="md-chip-tonal" style="background: var(--md-custom-color-success-container); color: var(--md-custom-color-on-success-container);">
            {{ $completedHabits }}/{{ $totalHabits }}
        </span>
        <a href="{{ route('habits', ['date' => $selectedDate]) }}" class="md-btn-text ms-auto" style="height: 32px; padding: 0 10px;">Ver todos</a>
    </div>
    <div class="md-progress-linear md-progress-linear--success mb-2">
        <div class="md-progress-linear-bar" style="width: {{ $totalHabits > 0 ? ($completedHabits / $totalHabits * 100) : 0 }}%"></div>
    </div>

    @forelse ($pendingHabits as $habit)
        <button type="button"
                wire:click="toggleHabit({{ $habit->id }})"
                wire:loading.attr="disabled"
                wire:target="toggleHabit({{ $habit->id }})"
                class="md-list-item habit-list-action w-100 text-start"
                wire:key="home-habit-{{ $selectedDate }}-{{ $habit->id }}">
            <div class="md-list-item-leading">
                <div class="md-list-checkbox"></div>
            </div>
            <div class="d-flex align-items-center gap-2 flex-grow-1">
                <span style="font-size: 1.25rem;">{{ $habit->icon }}</span>
                <div class="md-list-item-content">
                    <div class="md-list-item-headline">{{ $habit->name }}</div>
                    <div class="md-list-item-supporting">{{ $habit->goal_duration }} · {{ $habit->base_time }}</div>
                </div>
            </div>
        </button>
    @empty
        <p class="md-body-small mb-0" style="color: var(--md-sys-color-on-surface-variant);">
            @if ($totalHabits > 0 && $completedHabits >= $totalHabits)
                <i class="bi bi-stars" style="color: var(--md-custom-color-success);"></i> ¡Día completo! Todos tus hábitos están hechos.
            @elseif ($totalHabits === 0)
                Aún no tienes hábitos definidos.
            @else
                Nada pendiente en este momento del día. 🎉
            @endif
        </p>
    @endforelse
</div>
