<div>
    {{-- Header with date navigation --}}
    <div class="d-flex align-items-center justify-content-between mb-4">
        <h4 class="mb-0"><i class="bi bi-droplet text-primary"></i> Hidratación</h4>
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

    {{-- Progress Card --}}
    <div class="card mb-3 border-0 shadow-sm">
        <div class="card-body text-center py-4">
            <div class="position-relative d-inline-block mb-3">
                <div style="width: 120px; height: 120px;" class="position-relative">
                    <svg viewBox="0 0 120 120" style="transform: rotate(-90deg);">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="#e9ecef" stroke-width="10"/>
                        <circle cx="60" cy="60" r="54" fill="none" stroke="#0d6efd" stroke-width="10"
                                stroke-dasharray="{{ 2 * 3.14159 * 54 }}"
                                stroke-dashoffset="{{ 2 * 3.14159 * 54 * (1 - $percentage / 100) }}"
                                stroke-linecap="round"/>
                    </svg>
                    <div class="position-absolute top-50 start-50 translate-middle text-center">
                        <i class="bi bi-droplet-fill text-primary" style="font-size: 1.5rem;"></i>
                    </div>
                </div>
            </div>
            <div class="fw-bold text-primary fs-3">{{ number_format($totalHydration) }} ml</div>
            <div class="text-muted">de {{ number_format($dailyGoal) }} ml</div>
            <div class="progress mt-3 mx-auto" style="height: 8px; max-width: 300px;">
                <div class="progress-bar bg-primary" style="width: {{ $percentage }}%"></div>
            </div>
            <small class="text-muted mt-1 d-block">{{ number_format($percentage, 0) }}% completado</small>
        </div>
    </div>

    {{-- Quick Add Buttons --}}
    <div class="card mb-3 border-0 shadow-sm">
        <div class="card-header bg-transparent border-0">
            <h6 class="mb-0"><i class="bi bi-lightning-charge"></i> Agregar Rápido</h6>
        </div>
        <div class="card-body pt-0">
            <div class="d-flex flex-wrap gap-2">
                @foreach ($drinkTypes->take(6) as $type)
                    <button wire:click="quickAdd('{{ $type->id }}', 250)"
                            class="btn btn-sm btn-outline-primary">
                        {{ $type->icon ?? '💧' }} {{ $type->name }} (250ml)
                    </button>
                @endforeach
            </div>
        </div>
    </div>

    {{-- Add Custom Button --}}
    <div class="d-grid mb-3">
        <button wire:click="openForm" class="btn btn-primary">
            <i class="bi bi-plus-lg"></i> Registrar Bebida
        </button>
    </div>

    {{-- Add/Edit Form --}}
    @if ($showForm)
        <div class="card mb-3 border-primary">
            <div class="card-header bg-primary bg-opacity-10 d-flex justify-content-between align-items-center">
                <h6 class="mb-0">{{ $editingId ? 'Editar' : 'Nueva' }} Bebida</h6>
                <button wire:click="closeForm" class="btn-close btn-sm"></button>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <label class="form-label">Tipo de bebida</label>
                    <select wire:model="drinkTypeId" class="form-select">
                        <option value="">Seleccionar...</option>
                        @foreach ($drinkTypes as $type)
                            <option value="{{ $type->id }}">{{ $type->icon ?? '💧' }} {{ $type->name }} (x{{ $type->hydration_factor }})</option>
                        @endforeach
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Cantidad (ml)</label>
                    <input type="number" wire:model="amount" class="form-control" min="1" step="50">
                    <div class="d-flex gap-2 mt-2">
                        @foreach ([100, 200, 250, 330, 500] as $preset)
                            <button wire:click="$set('amount', {{ $preset }})" class="btn btn-sm btn-outline-secondary">
                                {{ $preset }}ml
                            </button>
                        @endforeach
                    </div>
                </div>
                <button wire:click="save" class="btn btn-primary w-100">
                    <i class="bi bi-check-lg"></i> {{ $editingId ? 'Actualizar' : 'Guardar' }}
                </button>
            </div>
        </div>
    @endif

    {{-- Today's Log --}}
    <div class="card border-0 shadow-sm">
        <div class="card-header bg-transparent border-0">
            <h6 class="mb-0"><i class="bi bi-clock-history"></i> Registro del día</h6>
        </div>
        <div class="card-body pt-0">
            @forelse ($logs as $log)
                <div class="d-flex align-items-center justify-content-between py-2 {{ !$loop->last ? 'border-bottom' : '' }}">
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-primary bg-opacity-10 text-primary">{{ $log->time }}</span>
                        <div>
                            <span class="fw-medium">{{ $log->drink_type }}</span>
                            <br>
                            <small class="text-muted">{{ $log->amount }} ml · {{ $log->hydration_value }} ml hidratación</small>
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
                    <i class="bi bi-droplet" style="font-size: 2rem;"></i>
                    <p class="mt-2 mb-0">Sin registros para este día</p>
                </div>
            @endforelse
        </div>
    </div>
</div>
