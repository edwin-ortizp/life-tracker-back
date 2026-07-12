<div>
    {{-- Header --}}
    <div class="d-flex align-items-center justify-content-between mb-4">
        <h4 class="mb-0"><i class="bi bi-flag text-primary"></i> Objetivos</h4>
        <div class="d-flex gap-2">
            <span class="badge bg-primary">{{ $activeCount }} activos</span>
            <span class="badge bg-success">{{ $completedCount }} completados</span>
        </div>
    </div>

    {{-- Filters --}}
    <div class="btn-group btn-group-sm mb-3">
        <button wire:click="$set('statusFilter', 'active')" class="btn {{ $statusFilter === 'active' ? 'btn-primary' : 'btn-outline-primary' }}">
            Activos
        </button>
        <button wire:click="$set('statusFilter', 'completed')" class="btn {{ $statusFilter === 'completed' ? 'btn-primary' : 'btn-outline-primary' }}">
            Completados
        </button>
        <button wire:click="$set('statusFilter', 'abandoned')" class="btn {{ $statusFilter === 'abandoned' ? 'btn-primary' : 'btn-outline-primary' }}">
            Abandonados
        </button>
        <button wire:click="$set('statusFilter', 'all')" class="btn {{ $statusFilter === 'all' ? 'btn-primary' : 'btn-outline-primary' }}">
            Todos
        </button>
    </div>

    {{-- Add Button --}}
    <div class="d-grid mb-3">
        <button wire:click="openForm" class="btn btn-primary">
            <i class="bi bi-plus-lg"></i> Nuevo Objetivo
        </button>
    </div>

    {{-- Form --}}
    @if ($showForm)
        <div class="card mb-3 border-primary">
            <div class="card-header bg-primary bg-opacity-10 d-flex justify-content-between align-items-center">
                <h6 class="mb-0">{{ $editingId ? 'Editar' : 'Nuevo' }} Objetivo</h6>
                <button wire:click="closeForm" class="btn-close btn-sm"></button>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <label class="form-label">Título</label>
                    <input type="text" wire:model="title" class="form-control" placeholder="¿Qué quieres lograr?">
                </div>
                <div class="mb-3">
                    <label class="form-label">Descripción</label>
                    <textarea wire:model="description" class="form-control" rows="2" placeholder="Detalles del objetivo..."></textarea>
                </div>
                <div class="row g-2 mb-3">
                    <div class="col-6">
                        <label class="form-label">Fecha inicio</label>
                        <input type="date" wire:model="startDate" class="form-control">
                    </div>
                    <div class="col-6">
                        <label class="form-label">Fecha límite</label>
                        <input type="date" wire:model="dueDate" class="form-control">
                    </div>
                </div>
                <button wire:click="save" class="btn btn-primary w-100">
                    <i class="bi bi-check-lg"></i> {{ $editingId ? 'Actualizar' : 'Crear' }}
                </button>
            </div>
        </div>
    @endif

    {{-- Goals List --}}
    @forelse ($goals as $goal)
        <div class="card mb-2 border-0 shadow-sm">
            <div class="card-body">
                <div class="d-flex align-items-start justify-content-between">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center gap-2">
                            @if ($goal->status === 'active')
                                <i class="bi bi-flag-fill text-primary"></i>
                            @elseif ($goal->status === 'completed')
                                <i class="bi bi-check-circle-fill text-success"></i>
                            @else
                                <i class="bi bi-x-circle-fill text-secondary"></i>
                            @endif
                            <h6 class="mb-0">{{ $goal->title }}</h6>
                        </div>
                        @if ($goal->description)
                            <p class="text-muted small mt-1 mb-1">{{ $goal->description }}</p>
                        @endif
                        <div class="d-flex gap-2 mt-1">
                            @if ($goal->start_date)
                                <small class="text-muted"><i class="bi bi-calendar"></i> {{ $goal->start_date->format('d M Y') }}</small>
                            @endif
                            @if ($goal->due_date)
                                <small class="{{ $goal->due_date->isPast() && $goal->status === 'active' ? 'text-danger' : 'text-muted' }}">
                                    <i class="bi bi-calendar-event"></i> {{ $goal->due_date->format('d M Y') }}
                                </small>
                            @endif
                        </div>
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                            <i class="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><button wire:click="openForm('{{ $goal->id }}')" class="dropdown-item"><i class="bi bi-pencil"></i> Editar</button></li>
                            @if ($goal->status === 'active')
                                <li><button wire:click="updateStatus('{{ $goal->id }}', 'completed')" class="dropdown-item text-success"><i class="bi bi-check-circle"></i> Completar</button></li>
                                <li><button wire:click="updateStatus('{{ $goal->id }}', 'abandoned')" class="dropdown-item text-warning"><i class="bi bi-x-circle"></i> Abandonar</button></li>
                            @else
                                <li><button wire:click="updateStatus('{{ $goal->id }}', 'active')" class="dropdown-item text-primary"><i class="bi bi-arrow-counterclockwise"></i> Reactivar</button></li>
                            @endif
                            <li><hr class="dropdown-divider"></li>
                            <li><button wire:click="delete('{{ $goal->id }}')" wire:confirm="¿Eliminar este objetivo?" class="dropdown-item text-danger"><i class="bi bi-trash"></i> Eliminar</button></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    @empty
        <div class="text-center py-5 text-muted">
            <i class="bi bi-flag" style="font-size: 3rem;"></i>
            <p class="mt-2">Sin objetivos {{ $statusFilter !== 'all' ? $statusFilter . 's' : '' }}</p>
        </div>
    @endforelse
</div>
