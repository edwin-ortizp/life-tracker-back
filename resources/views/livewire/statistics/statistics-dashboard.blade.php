<div>
    {{-- Header --}}
    <div class="d-flex align-items-center justify-content-between mb-4">
        <h4 class="mb-0"><i class="bi bi-bar-chart text-primary"></i> Estadísticas</h4>
        <div class="btn-group btn-group-sm">
            <button wire:click="$set('days', 7)" class="btn {{ $days === 7 ? 'btn-primary' : 'btn-outline-primary' }}">7 días</button>
            <button wire:click="$set('days', 14)" class="btn {{ $days === 14 ? 'btn-primary' : 'btn-outline-primary' }}">14 días</button>
            <button wire:click="$set('days', 30)" class="btn {{ $days === 30 ? 'btn-primary' : 'btn-outline-primary' }}">30 días</button>
        </div>
    </div>

    {{-- Summary Cards --}}
    <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body text-center">
                    <i class="bi bi-droplet text-primary" style="font-size: 1.5rem;"></i>
                    <div class="fw-bold fs-5 text-primary">{{ number_format($avgWater, 0) }}</div>
                    <small class="text-muted">ml/día promedio</small>
                </div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body text-center">
                    <i class="bi bi-fire text-danger" style="font-size: 1.5rem;"></i>
                    <div class="fw-bold fs-5 text-danger">{{ number_format($avgExercise, 0) }}</div>
                    <small class="text-muted">kcal/día promedio</small>
                </div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body text-center">
                    <i class="bi bi-check2-square text-success" style="font-size: 1.5rem;"></i>
                    <div class="fw-bold fs-5 text-success">{{ number_format($avgHabits, 1) }}/{{ $totalHabits }}</div>
                    <small class="text-muted">hábitos/día</small>
                </div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body text-center">
                    <i class="bi bi-journal text-purple" style="font-size: 1.5rem;"></i>
                    <div class="fw-bold fs-5">{{ $journalCount }}/{{ $days }}</div>
                    <small class="text-muted">días con diario</small>
                </div>
            </div>
        </div>
    </div>

    {{-- Water Chart --}}
    <div class="card mb-3 border-0 shadow-sm">
        <div class="card-header bg-transparent border-0">
            <h6 class="mb-0"><i class="bi bi-droplet text-primary"></i> Hidratación (ml)</h6>
        </div>
        <div class="card-body">
            <div class="d-flex align-items-end gap-1" style="height: 100px;">
                @php $maxWater = max(array_values($waterData) ?: [1]); @endphp
                @foreach ($dates as $date)
                    @php $val = $waterData[$date] ?? 0; @endphp
                    <div class="flex-grow-1 text-center">
                        <div class="bg-primary bg-opacity-75 rounded-top mx-auto" style="height: {{ $maxWater > 0 ? ($val / $maxWater * 80) : 0 }}px; min-height: 2px; max-width: 30px;"></div>
                        <small class="text-muted d-block" style="font-size: 0.65rem;">{{ \Carbon\Carbon::parse($date)->format('d') }}</small>
                    </div>
                @endforeach
            </div>
        </div>
    </div>

    {{-- Exercise Chart --}}
    <div class="card mb-3 border-0 shadow-sm">
        <div class="card-header bg-transparent border-0">
            <h6 class="mb-0"><i class="bi bi-fire text-danger"></i> Ejercicio (kcal)</h6>
        </div>
        <div class="card-body">
            <div class="d-flex align-items-end gap-1" style="height: 100px;">
                @php $maxExercise = max(array_values($exerciseData) ?: [1]); @endphp
                @foreach ($dates as $date)
                    @php $val = $exerciseData[$date] ?? 0; @endphp
                    <div class="flex-grow-1 text-center">
                        <div class="bg-danger bg-opacity-75 rounded-top mx-auto" style="height: {{ $maxExercise > 0 ? ($val / $maxExercise * 80) : 0 }}px; min-height: 2px; max-width: 30px;"></div>
                        <small class="text-muted d-block" style="font-size: 0.65rem;">{{ \Carbon\Carbon::parse($date)->format('d') }}</small>
                    </div>
                @endforeach
            </div>
        </div>
    </div>

    {{-- Habits Chart --}}
    <div class="card mb-3 border-0 shadow-sm">
        <div class="card-header bg-transparent border-0">
            <h6 class="mb-0"><i class="bi bi-check2-square text-success"></i> Hábitos completados</h6>
        </div>
        <div class="card-body">
            <div class="d-flex align-items-end gap-1" style="height: 100px;">
                @php $maxHabits = max($totalHabits, 1); @endphp
                @foreach ($dates as $date)
                    @php $val = $habitsData[$date] ?? 0; @endphp
                    <div class="flex-grow-1 text-center">
                        <div class="bg-success bg-opacity-75 rounded-top mx-auto" style="height: {{ ($val / $maxHabits * 80) }}px; min-height: 2px; max-width: 30px;"></div>
                        <small class="text-muted d-block" style="font-size: 0.65rem;">{{ \Carbon\Carbon::parse($date)->format('d') }}</small>
                    </div>
                @endforeach
            </div>
        </div>
    </div>

    {{-- Mood & Energy --}}
    <div class="row g-3 mb-3">
        <div class="col-md-6">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-header bg-transparent border-0">
                    <h6 class="mb-0"><i class="bi bi-emoji-smile text-success"></i> Estado de ánimo</h6>
                </div>
                <div class="card-body">
                    <div class="d-flex align-items-end gap-1" style="height: 80px;">
                        @foreach ($dates as $date)
                            @php $val = isset($moodData[$date]) ? $moodData[$date] : 0; @endphp
                            <div class="flex-grow-1 text-center">
                                <div class="bg-success bg-opacity-50 rounded-top mx-auto" style="height: {{ $val > 0 ? ($val / 5 * 70) : 2 }}px; min-height: 2px; max-width: 24px;"></div>
                            </div>
                        @endforeach
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-header bg-transparent border-0">
                    <h6 class="mb-0"><i class="bi bi-lightning-charge text-warning"></i> Energía</h6>
                </div>
                <div class="card-body">
                    <div class="d-flex align-items-end gap-1" style="height: 80px;">
                        @foreach ($dates as $date)
                            @php $val = isset($energyData[$date]) ? $energyData[$date] : 0; @endphp
                            <div class="flex-grow-1 text-center">
                                <div class="bg-warning bg-opacity-50 rounded-top mx-auto" style="height: {{ $val > 0 ? ($val / 5 * 70) : 2 }}px; min-height: 2px; max-width: 24px;"></div>
                            </div>
                        @endforeach
                    </div>
                </div>
            </div>
        </div>
    </div>

    {{-- Tasks Summary --}}
    <div class="card border-0 shadow-sm">
        <div class="card-header bg-transparent border-0">
            <h6 class="mb-0"><i class="bi bi-list-task text-info"></i> Tareas</h6>
        </div>
        <div class="card-body">
            <div class="row text-center">
                <div class="col-6">
                    <div class="fw-bold fs-4 text-warning">{{ $tasksPendingCount }}</div>
                    <small class="text-muted">Pendientes</small>
                </div>
                <div class="col-6">
                    <div class="fw-bold fs-4 text-success">{{ $tasksCompletedCount }}</div>
                    <small class="text-muted">Completadas</small>
                </div>
            </div>
        </div>
    </div>
</div>
