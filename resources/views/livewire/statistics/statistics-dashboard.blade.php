<x-module-shell module="statistics">
    <x-slot:actions><div class="md-chip-group" aria-label="Ventana de análisis"><button wire:click="$set('days', 7)" class="md-chip md-chip-filter {{ $days === 7 ? 'selected' : '' }}">7 días</button><button wire:click="$set('days', 14)" class="md-chip md-chip-filter {{ $days === 14 ? 'selected' : '' }}">14 días</button><button wire:click="$set('days', 30)" class="md-chip md-chip-filter {{ $days === 30 ? 'selected' : '' }}">30 días</button></div></x-slot:actions>

    {{-- Summary Cards --}}
    <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
            <div class="md-card-filled text-center" style="height: 100%;">
                <div class="md-card-icon md-card-icon--primary mx-auto mb-1" style="width: 36px; height: 36px;">
                    <i class="bi bi-droplet" style="font-size: 1rem;"></i>
                </div>
                <div class="md-title-large" style="color: var(--md-sys-color-primary);">{{ number_format($avgWater, 0) }}</div>
                <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">ml/día promedio</span>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="md-card-filled text-center" style="height: 100%;">
                <div class="md-card-icon mx-auto mb-1" style="width: 36px; height: 36px; background: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container);">
                    <i class="bi bi-fire" style="font-size: 1rem;"></i>
                </div>
                <div class="md-title-large" style="color: var(--md-sys-color-error);">{{ number_format($avgExercise, 0) }}</div>
                <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">kcal/día promedio</span>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="md-card-filled text-center" style="height: 100%;">
                <div class="md-card-icon mx-auto mb-1" style="width: 36px; height: 36px; background: var(--md-custom-color-success-container); color: var(--md-custom-color-on-success-container);">
                    <i class="bi bi-check2-square" style="font-size: 1rem;"></i>
                </div>
                <div class="md-title-large" style="color: var(--md-custom-color-success);">{{ number_format($avgHabits, 1) }}/{{ $totalHabits }}</div>
                <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">hábitos/día</span>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="md-card-filled text-center" style="height: 100%;">
                <div class="md-card-icon md-card-icon--tertiary mx-auto mb-1" style="width: 36px; height: 36px;">
                    <i class="bi bi-journal" style="font-size: 1rem;"></i>
                </div>
                <div class="md-title-large" style="color: var(--md-sys-color-tertiary);">{{ $journalCount }}/{{ $days }}</div>
                <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">días con diario</span>
            </div>
        </div>
    </div>

    {{-- Water Chart --}}
    <div class="md-card-elevated mb-3" style="padding: 0; overflow: hidden;">
        <div style="padding: 16px;">
            <span class="md-title-small" style="color: var(--md-sys-color-on-surface);">
                <i class="bi bi-droplet" style="color: var(--md-sys-color-primary);"></i> Hidratación (ml)
            </span>
        </div>
        <div style="padding: 0 16px 16px 16px;">
            <div class="d-flex align-items-end gap-1" style="height: 100px;">
                @php $maxWater = max(array_values($waterData) ?: [1]); @endphp
                @foreach ($dates as $date)
                    @php $val = $waterData[$date] ?? 0; @endphp
                    <div class="flex-grow-1 text-center">
                        <div style="height: {{ $maxWater > 0 ? ($val / $maxWater * 80) : 0 }}px; min-height: 2px; max-width: 30px; background: var(--md-sys-color-primary); opacity: 0.75; border-radius: var(--md-sys-shape-corner-extra-small) var(--md-sys-shape-corner-extra-small) 0 0; margin: 0 auto;"></div>
                        <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">{{ \Carbon\Carbon::parse($date)->format('d') }}</span>
                    </div>
                @endforeach
            </div>
        </div>
    </div>

    {{-- Exercise Chart --}}
    <div class="md-card-elevated mb-3" style="padding: 0; overflow: hidden;">
        <div style="padding: 16px;">
            <span class="md-title-small" style="color: var(--md-sys-color-on-surface);">
                <i class="bi bi-fire" style="color: var(--md-sys-color-error);"></i> Ejercicio (kcal)
            </span>
        </div>
        <div style="padding: 0 16px 16px 16px;">
            <div class="d-flex align-items-end gap-1" style="height: 100px;">
                @php $maxExercise = max(array_values($exerciseData) ?: [1]); @endphp
                @foreach ($dates as $date)
                    @php $val = $exerciseData[$date] ?? 0; @endphp
                    <div class="flex-grow-1 text-center">
                        <div style="height: {{ $maxExercise > 0 ? ($val / $maxExercise * 80) : 0 }}px; min-height: 2px; max-width: 30px; background: var(--md-sys-color-error); opacity: 0.75; border-radius: var(--md-sys-shape-corner-extra-small) var(--md-sys-shape-corner-extra-small) 0 0; margin: 0 auto;"></div>
                        <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">{{ \Carbon\Carbon::parse($date)->format('d') }}</span>
                    </div>
                @endforeach
            </div>
        </div>
    </div>

    {{-- Habits Chart --}}
    <div class="md-card-elevated mb-3" style="padding: 0; overflow: hidden;">
        <div style="padding: 16px;">
            <span class="md-title-small" style="color: var(--md-sys-color-on-surface);">
                <i class="bi bi-check2-square" style="color: var(--md-custom-color-success);"></i> Hábitos completados
            </span>
        </div>
        <div style="padding: 0 16px 16px 16px;">
            <div class="d-flex align-items-end gap-1" style="height: 100px;">
                @php $maxHabits = max($totalHabits, 1); @endphp
                @foreach ($dates as $date)
                    @php $val = $habitsData[$date] ?? 0; @endphp
                    <div class="flex-grow-1 text-center">
                        <div style="height: {{ ($val / $maxHabits * 80) }}px; min-height: 2px; max-width: 30px; background: var(--md-custom-color-success); opacity: 0.75; border-radius: var(--md-sys-shape-corner-extra-small) var(--md-sys-shape-corner-extra-small) 0 0; margin: 0 auto;"></div>
                        <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">{{ \Carbon\Carbon::parse($date)->format('d') }}</span>
                    </div>
                @endforeach
            </div>
        </div>
    </div>

    {{-- Mood & Energy --}}
    <div class="row g-3 mb-3">
        <div class="col-md-6">
            <div class="md-card-elevated" style="padding: 0; overflow: hidden; height: 100%;">
                <div style="padding: 16px;">
                    <span class="md-title-small" style="color: var(--md-sys-color-on-surface);">
                        <i class="bi bi-emoji-smile" style="color: var(--md-custom-color-success);"></i> Estado de ánimo
                    </span>
                </div>
                <div style="padding: 0 16px 16px 16px;">
                    <div class="d-flex align-items-end gap-1" style="height: 80px;">
                        @foreach ($dates as $date)
                            @php $val = isset($moodData[$date]) ? $moodData[$date] : 0; @endphp
                            <div class="flex-grow-1 text-center">
                                <div style="height: {{ $val > 0 ? ($val / 5 * 70) : 2 }}px; min-height: 2px; max-width: 24px; background: var(--md-custom-color-success); opacity: 0.5; border-radius: var(--md-sys-shape-corner-extra-small) var(--md-sys-shape-corner-extra-small) 0 0; margin: 0 auto;"></div>
                            </div>
                        @endforeach
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="md-card-elevated" style="padding: 0; overflow: hidden; height: 100%;">
                <div style="padding: 16px;">
                    <span class="md-title-small" style="color: var(--md-sys-color-on-surface);">
                        <i class="bi bi-lightning-charge" style="color: var(--md-custom-color-warning);"></i> Energía
                    </span>
                </div>
                <div style="padding: 0 16px 16px 16px;">
                    <div class="d-flex align-items-end gap-1" style="height: 80px;">
                        @foreach ($dates as $date)
                            @php $val = isset($energyData[$date]) ? $energyData[$date] : 0; @endphp
                            <div class="flex-grow-1 text-center">
                                <div style="height: {{ $val > 0 ? ($val / 5 * 70) : 2 }}px; min-height: 2px; max-width: 24px; background: var(--md-custom-color-warning); opacity: 0.5; border-radius: var(--md-sys-shape-corner-extra-small) var(--md-sys-shape-corner-extra-small) 0 0; margin: 0 auto;"></div>
                            </div>
                        @endforeach
                    </div>
                </div>
            </div>
        </div>
    </div>

    {{-- Tasks Summary --}}
    <div class="md-card-elevated" style="padding: 0; overflow: hidden;">
        <div style="padding: 16px;">
            <span class="md-title-small" style="color: var(--md-sys-color-on-surface);">
                <i class="bi bi-list-task" style="color: var(--md-custom-color-info);"></i> Tareas
            </span>
        </div>
        <div style="padding: 0 16px 16px 16px;">
            <div class="row text-center">
                <div class="col-6">
                    <div class="md-headline-small" style="color: var(--md-custom-color-warning);">{{ $tasksPendingCount }}</div>
                    <span class="md-label-medium" style="color: var(--md-sys-color-on-surface-variant);">Pendientes</span>
                </div>
                <div class="col-6">
                    <div class="md-headline-small" style="color: var(--md-custom-color-success);">{{ $tasksCompletedCount }}</div>
                    <span class="md-label-medium" style="color: var(--md-sys-color-on-surface-variant);">Completadas</span>
                </div>
            </div>
        </div>
    </div>
</x-module-shell>
