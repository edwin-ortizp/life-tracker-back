<div>
    {{-- Header --}}
    <div class="d-flex align-items-center justify-content-between mb-4">
        <h4 class="mb-0"><i class="bi bi-list-task text-info"></i> Tareas</h4>
        <div class="d-flex gap-2">
            <span class="badge bg-warning text-dark">{{ $pendingCount }} pendientes</span>
            <span class="badge bg-success">{{ $completedCount }} completadas</span>
        </div>
    </div>

    {{-- Filters --}}
    <div class="card mb-3 border-0 shadow-sm">
        <div class="card-body py-2">
            <div class="d-flex flex-wrap gap-2 align-items-center">
                <div class="btn-group btn-group-sm">
                    <button wire:click="$set('filter', 'pending')" class="btn {{ $filter === 'pending' ? 'btn-info' : 'btn-outline-info' }}">
                        Pendientes
                    </button>
                    <button wire:click="$set('filter', 'completed')" class="btn {{ $filter === 'completed' ? 'btn-info' : 'btn-outline-info' }}">
                        Completadas
                    </button>
                    <button wire:click="$set('filter', 'all')" class="btn {{ $filter === 'all' ? 'btn-info' : 'btn-outline-info' }}">
                        Todas
                    </button>
                </div>
                <select wire:model.live="categoryFilter" class="form-select form-select-sm" style="width: auto;">
                    <option value="">Categoría</option>
                    @foreach ($categories as $key => $label)
                        <option value="{{ $key }}">{{ $label }}</option>
                    @endforeach
                </select>
                <select wire:model.live="priorityFilter" class="form-select form-select-sm" style="width: auto;">
                    <option value="">Prioridad</option>
                    @foreach ($priorities as $key => $label)
                        <option value="{{ $key }}">{{ $label }}</option>
                    @endforeach
                </select>
            </div>
        </div>
    </div>

    {{-- Add Button --}}
    <div class="d-grid mb-3">
        <button wire:click="openForm" class="btn btn-info text-white">
            <i class="bi bi-plus-lg"></i> Nueva Tarea
        </button>
    </div>

    {{-- Add/Edit Form --}}
    @if ($showForm)
        <div class="card mb-3 border-info">
            <div class="card-header bg-info bg-opacity-10 d-flex justify-content-between align-items-center">
                <h6 class="mb-0">{{ $editingId ? 'Editar' : 'Nueva' }} Tarea</h6>
                <button wire:click="closeForm" class="btn-close btn-sm"></button>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <label class="form-label">Título</label>
                    <input type="text" wire:model="title" class="form-control" placeholder="¿Qué necesitas hacer?">
                </div>
                <div class="mb-3">
                    <label class="form-label">Descripción</label>
                    <textarea wire:model="description" class="form-control" rows="2" placeholder="Detalles opcionales..."></textarea>
                </div>
                <div class="row g-2 mb-3">
                    <div class="col-md-4">
                        <label class="form-label">Categoría</label>
                        <select wire:model="category" class="form-select">
                            <option value="">Sin categoría</option>
                            @foreach ($categories as $key => $label)
                                <option value="{{ $key }}">{{ $label }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Prioridad</label>
                        <select wire:model="priority" class="form-select">
                            <option value="">Sin prioridad</option>
                            @foreach ($priorities as $key => $label)
                                <option value="{{ $key }}">{{ $label }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Tamaño</label>
                        <select wire:model="size" class="form-select">
                            <option value="">Sin tamaño</option>
                            @foreach ($sizes as $key => $label)
                                <option value="{{ $key }}">{{ $label }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>
                <div class="row g-2 mb-3">
                    <div class="col-6">
                        <label class="form-label">Fecha inicio</label>
                        <input type="date" wire:model="startDate" class="form-control">
                    </div>
                    <div class="col-6">
                        <label class="form-label">Fecha fin</label>
                        <input type="date" wire:model="endDate" class="form-control">
                    </div>
                </div>
                <div class="form-check mb-3">
                    <input type="checkbox" wire:model="isPrivate" class="form-check-input" id="isPrivate">
                    <label class="form-check-label" for="isPrivate">
                        <i class="bi bi-lock"></i> Tarea privada
                    </label>
                </div>
                <button wire:click="save" class="btn btn-info text-white w-100">
                    <i class="bi bi-check-lg"></i> {{ $editingId ? 'Actualizar' : 'Crear' }}
                </button>
            </div>
        </div>
    @endif

    {{-- Task List --}}
    <div class="card border-0 shadow-sm">
        <div class="card-body p-0">
            @forelse ($tasks as $task)
                <div class="d-flex align-items-start gap-3 p-3 {{ !$loop->last ? 'border-bottom' : '' }} {{ $task->completed ? 'bg-light' : '' }}">
                    <button wire:click="toggleComplete('{{ $task->id }}')"
                            class="btn p-0 mt-1 flex-shrink-0">
                        <div class="d-flex align-items-center justify-content-center rounded-circle {{ $task->completed ? 'bg-success text-white' : 'border border-2' }}"
                             style="width: 28px; height: 28px;">
                            @if ($task->completed)
                                <i class="bi bi-check-lg small"></i>
                            @endif
                        </div>
                    </button>
                    <div class="flex-grow-1 min-w-0">
                        <div class="d-flex align-items-center gap-2">
                            <span class="{{ $task->completed ? 'text-decoration-line-through text-muted' : 'fw-medium' }}">
                                {{ $task->title }}
                            </span>
                            @if ($task->is_private)
                                <i class="bi bi-lock-fill text-muted small"></i>
                            @endif
                        </div>
                        @if ($task->description)
                            <small class="text-muted d-block text-truncate">{{ $task->description }}</small>
                        @endif
                        <div class="d-flex flex-wrap gap-1 mt-1">
                            @if ($task->priority)
                                @php
                                    $priorityColors = [
                                        'urgent-important' => 'danger',
                                        'not-urgent-important' => 'warning',
                                        'urgent-not-important' => 'orange',
                                        'not-urgent-not-important' => 'secondary',
                                    ];
                                    $pColor = $priorityColors[$task->priority] ?? 'secondary';
                                @endphp
                                <span class="badge bg-{{ $pColor }} bg-opacity-10 text-{{ $pColor }}">{{ $priorities[$task->priority] ?? $task->priority }}</span>
                            @endif
                            @if ($task->category)
                                <span class="badge bg-info bg-opacity-10 text-info">{{ $categories[$task->category] ?? $task->category }}</span>
                            @endif
                            @if ($task->size)
                                <span class="badge bg-secondary bg-opacity-10 text-secondary">{{ $task->size }}</span>
                            @endif
                            @if ($task->end_date)
                                <span class="badge bg-dark bg-opacity-10 text-dark">
                                    <i class="bi bi-calendar"></i> {{ $task->end_date->format('d M') }}
                                </span>
                            @endif
                        </div>
                    </div>
                    <div class="d-flex gap-1 flex-shrink-0">
                        <button wire:click="openForm('{{ $task->id }}')" class="btn btn-sm btn-outline-secondary">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button wire:click="delete('{{ $task->id }}')" wire:confirm="¿Eliminar esta tarea?" class="btn btn-sm btn-outline-danger">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            @empty
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-list-task" style="font-size: 2rem;"></i>
                    <p class="mt-2 mb-0">No hay tareas {{ $filter === 'pending' ? 'pendientes' : ($filter === 'completed' ? 'completadas' : '') }}</p>
                </div>
            @endforelse
        </div>
    </div>
</div>
