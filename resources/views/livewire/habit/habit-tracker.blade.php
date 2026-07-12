<div>
    {{-- Header with date navigation --}}
    <div class="d-flex align-items-center justify-content-between mb-4">
        <h4 class="mb-0"><i class="bi bi-check2-square text-primary"></i> Hábitos</h4>
        <div class="d-flex align-items-center gap-2">
            <button wire:click="previousDay" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-chevron-left"></i>
            </button>
            <button wire:click="today" class="btn btn-sm {{ $selectedDate === now()->toDateString() ? 'btn-primary' : 'btn-outline-primary' }}">
                Hoy
            </button>
            <span class="fw-medium">{{ \Carbon\Carbon::parse($selectedDate)->translatedFormat('D d M') }}</span>
            <button wire:click="nextDay" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-chevron-right"></i>
            </button>
        </div>
    </div>

    {{-- Progress bar --}}
    <div class="card mb-3">
        <div class="card-body py-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-muted">Progreso del día</span>
                <span class="fw-bold">{{ $completedCount }}/{{ $totalCount }}</span>
            </div>
            <div class="progress" style="height: 8px;">
                <div class="progress-bar bg-success" style="width: {{ $totalCount > 0 ? ($completedCount / $totalCount * 100) : 0 }}%"></div>
            </div>
        </div>
    </div>

    {{-- Habits grouped by time of day --}}
    @php
        $timeLabels = [
            'morning' => ['label' => 'Mañana', 'icon' => 'bi-sunrise', 'color' => 'warning'],
            'afternoon' => ['label' => 'Tarde', 'icon' => 'bi-sun', 'color' => 'info'],
            'night' => ['label' => 'Noche', 'icon' => 'bi-moon-stars', 'color' => 'indigo'],
            'anytime' => ['label' => 'Cualquier momento', 'icon' => 'bi-clock', 'color' => 'secondary'],
        ];
    @endphp

    @foreach (['morning', 'afternoon', 'night', 'anytime'] as $timeOfDay)
        @if (isset($groupedHabits[$timeOfDay]) && $groupedHabits[$timeOfDay]->count() > 0)
            <div class="card mb-3">
                <div class="card-header bg-transparent border-0 pb-0">
                    <h6 class="mb-0">
                        <i class="bi {{ $timeLabels[$timeOfDay]['icon'] }} text-{{ $timeLabels[$timeOfDay]['color'] }}"></i>
                        {{ $timeLabels[$timeOfDay]['label'] }}
                        <span class="badge bg-{{ $timeLabels[$timeOfDay]['color'] }} bg-opacity-10 text-{{ $timeLabels[$timeOfDay]['color'] }} ms-2">
                            {{ $groupedHabits[$timeOfDay]->filter(fn($h) => !empty($completions[$h->id]))->count() }}/{{ $groupedHabits[$timeOfDay]->count() }}
                        </span>
                    </h6>
                </div>
                <div class="card-body pt-2">
                    @foreach ($groupedHabits[$timeOfDay] as $habit)
                        @php
                            $isCompleted = !empty($completions[$habit->id]);
                        @endphp
                        <div wire:click="toggleHabit({{ $habit->id }})"
                             class="d-flex align-items-center gap-3 p-2 rounded-3 mb-1 cursor-pointer {{ $isCompleted ? 'bg-success bg-opacity-10' : '' }}"
                             style="cursor: pointer; transition: all 0.2s;"
                             wire:key="habit-{{ $habit->id }}">
                            <div class="d-flex align-items-center justify-content-center rounded-circle {{ $isCompleted ? 'bg-success text-white' : 'border border-2' }}"
                                 style="width: 32px; height: 32px; min-width: 32px;">
                                @if ($isCompleted)
                                    <i class="bi bi-check-lg"></i>
                                @endif
                            </div>
                            <span class="fs-5">{{ $habit->icon }}</span>
                            <div class="flex-grow-1">
                                <span class="{{ $isCompleted ? 'text-decoration-line-through text-muted' : '' }}">
                                    {{ $habit->name }}
                                </span>
                                <br>
                                <small class="text-muted">{{ $habit->goal_duration }} · {{ $habit->base_time }}</small>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        @endif
    @endforeach
</div>
