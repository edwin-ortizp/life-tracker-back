<div>
    {{-- Header with date navigation --}}
    <div class="d-flex align-items-center justify-content-between mb-4">
        <h4 class="mb-0"><i class="bi bi-activity text-danger"></i> Ejercicio</h4>
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

    {{-- Daily Stats --}}
    <div class="row g-3 mb-3">
        <div class="col-4">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body text-center py-3">
                    <i class="bi bi-fire text-danger" style="font-size: 1.5rem;"></i>
                    <div class="fw-bold fs-5 text-danger">{{ number_format($totalCalories) }}</div>
                    <small class="text-muted">kcal</small>
                </div>
            </div>
        </div>
        <div class="col-4">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body text-center py-3">
                    <i class="bi bi-clock text-info" style="font-size: 1.5rem;"></i>
                    <div class="fw-bold fs-5 text-info">{{ $totalDuration }}</div>
                    <small class="text-muted">min</small>
                </div>
            </div>
        </div>
        <div class="col-4">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body text-center py-3">
                    <i class="bi bi-signpost-2 text-success" style="font-size: 1.5rem;"></i>
                    <div class="fw-bold fs-5 text-success">{{ number_format($totalSteps) }}</div>
                    <small class="text-muted">pasos</small>
                </div>
            </div>
        </div>
    </div>

    {{-- Add Button --}}
    <div class="d-grid mb-3">
        <button wire:click="openForm" class="btn btn-danger">
            <i class="bi bi-plus-lg"></i> Registrar Ejercicio
        </button>
    </div>

    {{-- Add/Edit Form --}}
    @if ($showForm)
        <div class="card mb-3 border-danger">
            <div class="card-header bg-danger bg-opacity-10 d-flex justify-content-between align-items-center">
                <h6 class="mb-0">{{ $editingId ? 'Editar' : 'Nuevo' }} Ejercicio</h6>
                <button wire:click="closeForm" class="btn-close btn-sm"></button>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <label class="form-label">Tipo de ejercicio</label>
                    <select wire:model.live="exerciseTypeId" class="form-select">
                        <option value="">Seleccionar...</option>
                        @foreach ($exerciseTypes as $type)
                            <option value="{{ $type->id }}">{{ $type->icon ?? '🏃' }} {{ $type->name }}</option>
                        @endforeach
                    </select>
                </div>

                <div class="row g-2 mb-3">
                    <div class="col-6">
                        <label class="form-label">Duración (min)</label>
                        <input type="number" wire:model.live="duration" class="form-control" min="0" placeholder="0">
                    </div>
                    <div class="col-6">
                        <label class="form-label">Calorías</label>
                        <input type="number" wire:model="calories" class="form-control" min="0" placeholder="Auto">
                    </div>
                </div>

                <div class="row g-2 mb-3">
                    <div class="col-4">
                        <label class="form-label">Series</label>
                        <input type="number" wire:model="sets" class="form-control" min="0" placeholder="0">
                    </div>
                    <div class="col-4">
                        <label class="form-label">Reps</label>
                        <input type="number" wire:model="reps" class="form-control" min="0" placeholder="0">
                    </div>
                    <div class="col-4">
                        <label class="form-label">Peso (kg)</label>
                        <input type="number" wire:model="weight" class="form-control" min="0" step="0.5" placeholder="0">
                    </div>
                </div>

                <div class="row g-2 mb-3">
                    <div class="col-6">
                        <label class="form-label">Distancia (km)</label>
                        <input type="number" wire:model="distance" class="form-control" min="0" step="0.1" placeholder="0">
                    </div>
                    <div class="col-6">
                        <label class="form-label">Pasos</label>
                        <input type="number" wire:model="steps" class="form-control" min="0" placeholder="Auto">
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label">Notas</label>
                    <input type="text" wire:model="notes" class="form-control" placeholder="Notas opcionales...">
                </div>

                <button wire:click="save" class="btn btn-danger w-100">
                    <i class="bi bi-check-lg"></i> {{ $editingId ? 'Actualizar' : 'Guardar' }}
                </button>
            </div>
        </div>
    @endif

    {{-- Exercise Log --}}
    <div class="card border-0 shadow-sm">
        <div class="card-header bg-transparent border-0">
            <h6 class="mb-0"><i class="bi bi-list-ul"></i> Actividades del día</h6>
        </div>
        <div class="card-body pt-0">
            @forelse ($logs as $log)
                <div class="d-flex align-items-center justify-content-between py-2 {{ !$loop->last ? 'border-bottom' : '' }}">
                    <div class="d-flex align-items-center gap-3">
                        <div class="rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center"
                             style="width: 40px; height: 40px; min-width: 40px;">
                            <span>{{ $log->exerciseType?->icon ?? '🏃' }}</span>
                        </div>
                        <div>
                            <span class="fw-medium">{{ $log->exerciseType?->name ?? 'Ejercicio' }}</span>
                            <br>
                            <small class="text-muted">
                                @if ($log->duration)
                                    {{ $log->duration }} min
                                @endif
                                @if ($log->calories)
                                    · {{ $log->calories }} kcal
                                @endif
                                @if ($log->sets && $log->reps)
                                    · {{ $log->sets }}x{{ $log->reps }}
                                @endif
                                @if ($log->weight)
                                    · {{ $log->weight }}kg
                                @endif
                                @if ($log->distance)
                                    · {{ $log->distance }}km
                                @endif
                                @if ($log->steps)
                                    · {{ number_format($log->steps) }} pasos
                                @endif
                            </small>
                            @if ($log->notes)
                                <br><small class="text-muted fst-italic">{{ $log->notes }}</small>
                            @endif
                        </div>
                    </div>
                    <div class="d-flex gap-1">
                        <button wire:click="openForm('{{ $log->id }}')" class="btn btn-sm btn-outline-secondary">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button wire:click="delete('{{ $log->id }}')" wire:confirm="¿Eliminar este registro?" class="btn btn-sm btn-outline-danger">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            @empty
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-activity" style="font-size: 2rem;"></i>
                    <p class="mt-2 mb-0">Sin ejercicios registrados</p>
                </div>
            @endforelse
        </div>
    </div>
</div>
