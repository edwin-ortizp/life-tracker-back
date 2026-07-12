<div>
    {{-- Header --}}
    <div class="d-flex align-items-center justify-content-between mb-4">
        <h4 class="mb-0"><i class="bi bi-hand-thumbs-down text-danger"></i> Hábitos Negativos</h4>
        <div class="d-flex align-items-center gap-2">
            <button wire:click="previousWeek" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-chevron-left"></i>
            </button>
            <button wire:click="thisWeek" class="btn btn-sm btn-outline-primary">
                Esta semana
            </button>
            <span class="fw-medium">{{ $weekStart->format('d M') }} - {{ $weekEnd->format('d M') }}</span>
            <button wire:click="nextWeek" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-chevron-right"></i>
            </button>
        </div>
    </div>

    {{-- Weekly Summary --}}
    <div class="card mb-3 border-0 shadow-sm">
        <div class="card-body text-center py-3">
            <div class="fw-bold fs-3 {{ $weeklyCount > 0 ? 'text-danger' : 'text-success' }}">{{ $weeklyCount }}</div>
            <small class="text-muted">incidencias esta semana</small>
        </div>
    </div>

    {{-- Log Form Modal --}}
    @if ($showLogForm)
        <div class="card mb-3 border-danger">
            <div class="card-header bg-danger bg-opacity-10 d-flex justify-content-between align-items-center">
                <h6 class="mb-0">Registrar Incidencia</h6>
                <button wire:click="closeLogForm" class="btn-close btn-sm"></button>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <label class="form-label">Nota (opcional)</label>
                    <input type="text" wire:model="note" class="form-control" placeholder="¿Qué pasó?">
                </div>
                <button wire:click="saveLog" class="btn btn-danger w-100">
                    <i class="bi bi-plus-lg"></i> Registrar
                </button>
            </div>
        </div>
    @endif

    {{-- Habits grouped by category --}}
    @php
        $grouped = $habits->groupBy('category');
    @endphp

    @foreach ($grouped as $category => $categoryHabits)
        <div class="card mb-3 border-0 shadow-sm">
            <div class="card-header bg-transparent border-0">
                <h6 class="mb-0 text-capitalize">{{ $category }}</h6>
            </div>
            <div class="card-body pt-0">
                @foreach ($categoryHabits as $habit)
                    @php
                        $habitLogs = $logs->get($habit->id, collect());
                        $count = $habitLogs->count();
                    @endphp
                    <div class="d-flex align-items-center justify-content-between py-2 {{ !$loop->last ? 'border-bottom' : '' }}">
                        <div class="d-flex align-items-center gap-2">
                            <span style="font-size: 1.2rem;">{{ $habit->icon }}</span>
                            <div>
                                <span class="fw-medium">{{ $habit->name }}</span>
                                @if ($count > 0)
                                    <span class="badge bg-danger ms-2">{{ $count }}</span>
                                @endif
                            </div>
                        </div>
                        <button wire:click="openLogForm({{ $habit->id }})" class="btn btn-sm btn-outline-danger">
                            <i class="bi bi-plus"></i>
                        </button>
                    </div>
                @endforeach
            </div>
        </div>
    @endforeach
</div>
