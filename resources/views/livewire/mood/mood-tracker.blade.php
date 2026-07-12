<div>
    {{-- Header with date navigation --}}
    <div class="d-flex align-items-center justify-content-between mb-4">
        <h4 class="mb-0"><i class="bi bi-emoji-smile text-success"></i> Estado de Ánimo</h4>
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

    {{-- Quick Summary --}}
    <div class="row g-3 mb-3">
        <div class="col-6">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body text-center">
                    <div style="font-size: 2.5rem;">{{ $moodEntries->first()?->emoji ?? '😶' }}</div>
                    <small class="text-muted">Último estado</small>
                </div>
            </div>
        </div>
        <div class="col-6">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body text-center">
                    <div class="fw-bold text-warning fs-2">
                        <i class="bi bi-lightning-charge"></i>
                        {{ $avgEnergy ? number_format($avgEnergy, 1) : '-' }}/5
                    </div>
                    <small class="text-muted">Energía promedio</small>
                </div>
            </div>
        </div>
    </div>

    {{-- Add Buttons --}}
    <div class="row g-2 mb-3">
        <div class="col-6">
            <button wire:click="openMoodForm" class="btn btn-success w-100">
                <i class="bi bi-emoji-smile"></i> Registrar Estado
            </button>
        </div>
        <div class="col-6">
            <button wire:click="openEnergyForm" class="btn btn-warning w-100">
                <i class="bi bi-lightning-charge"></i> Registrar Energía
            </button>
        </div>
    </div>

    {{-- Mood Selection Form --}}
    @if ($showMoodForm)
        <div class="card mb-3 border-success">
            <div class="card-header bg-success bg-opacity-10 d-flex justify-content-between align-items-center">
                <h6 class="mb-0">¿Cómo te sientes?</h6>
                <button wire:click="closeMoodForm" class="btn-close btn-sm"></button>
            </div>
            <div class="card-body">
                <div class="d-flex flex-wrap gap-2 justify-content-center">
                    @foreach ($moodStates as $state)
                        <button wire:click="saveMood('{{ $state->id }}')"
                                class="btn btn-outline-secondary text-center p-2"
                                style="width: 80px;"
                                title="{{ $state->text }}">
                            <div style="font-size: 1.5rem;">{{ $state->emoji }}</div>
                            <small class="d-block text-truncate">{{ $state->text }}</small>
                        </button>
                    @endforeach
                </div>
            </div>
        </div>
    @endif

    {{-- Energy Form --}}
    @if ($showEnergyForm)
        <div class="card mb-3 border-warning">
            <div class="card-header bg-warning bg-opacity-10 d-flex justify-content-between align-items-center">
                <h6 class="mb-0">Nivel de Energía</h6>
                <button wire:click="closeEnergyForm" class="btn-close btn-sm"></button>
            </div>
            <div class="card-body">
                <div class="d-flex justify-content-center gap-2 mb-3">
                    @for ($i = 1; $i <= 5; $i++)
                        <button wire:click="$set('energyLevel', {{ $i }})"
                                class="btn {{ $energyLevel >= $i ? 'btn-warning' : 'btn-outline-secondary' }} rounded-circle d-flex align-items-center justify-content-center"
                                style="width: 48px; height: 48px;">
                            <i class="bi bi-lightning-charge-fill"></i>
                        </button>
                    @endfor
                </div>
                <div class="text-center mb-3">
                    <span class="fw-bold fs-5">{{ $energyLevel }}/5</span>
                </div>
                <div class="mb-3">
                    <input type="text" wire:model="energyComment" class="form-control" placeholder="Comentario (opcional)">
                </div>
                <button wire:click="saveEnergy" class="btn btn-warning w-100">
                    <i class="bi bi-check-lg"></i> Guardar
                </button>
            </div>
        </div>
    @endif

    {{-- Mood Entries --}}
    <div class="card mb-3 border-0 shadow-sm">
        <div class="card-header bg-transparent border-0">
            <h6 class="mb-0"><i class="bi bi-emoji-smile"></i> Estados del día</h6>
        </div>
        <div class="card-body pt-0">
            @forelse ($moodEntries as $entry)
                <div class="d-flex align-items-center justify-content-between py-2 {{ !$loop->last ? 'border-bottom' : '' }}">
                    <div class="d-flex align-items-center gap-3">
                        <span style="font-size: 1.5rem;">{{ $entry->emoji }}</span>
                        <div>
                            <span class="fw-medium">{{ $entry->text }}</span>
                            <br>
                            <small class="text-muted">{{ $entry->time }}</small>
                        </div>
                    </div>
                    <button wire:click="deleteMood('{{ $entry->id }}')" wire:confirm="¿Eliminar este registro?" class="btn btn-sm btn-outline-danger">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            @empty
                <div class="text-center py-3 text-muted">
                    <p class="mb-0">Sin registros de estado</p>
                </div>
            @endforelse
        </div>
    </div>

    {{-- Energy Entries --}}
    <div class="card border-0 shadow-sm">
        <div class="card-header bg-transparent border-0">
            <h6 class="mb-0"><i class="bi bi-lightning-charge text-warning"></i> Energía del día</h6>
        </div>
        <div class="card-body pt-0">
            @forelse ($energyEntries as $entry)
                <div class="d-flex align-items-center justify-content-between py-2 {{ !$loop->last ? 'border-bottom' : '' }}">
                    <div class="d-flex align-items-center gap-3">
                        <div class="d-flex gap-1">
                            @for ($i = 1; $i <= 5; $i++)
                                <i class="bi bi-lightning-charge-fill {{ $i <= $entry->level ? 'text-warning' : 'text-muted opacity-25' }}"></i>
                            @endfor
                        </div>
                        <div>
                            <span class="fw-medium">{{ $entry->level }}/5</span>
                            @if ($entry->comment)
                                <br><small class="text-muted">{{ $entry->comment }}</small>
                            @endif
                            <br><small class="text-muted">{{ $entry->time }}</small>
                        </div>
                    </div>
                    <button wire:click="deleteEnergy('{{ $entry->id }}')" wire:confirm="¿Eliminar este registro?" class="btn btn-sm btn-outline-danger">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            @empty
                <div class="text-center py-3 text-muted">
                    <p class="mb-0">Sin registros de energía</p>
                </div>
            @endforelse
        </div>
    </div>
</div>
