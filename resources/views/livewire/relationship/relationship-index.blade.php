<div>
    {{-- Header --}}
    <div class="d-flex align-items-center justify-content-between mb-4">
        <h4 class="mb-0"><i class="bi bi-people text-info"></i> Relaciones</h4>
        <span class="badge bg-info">{{ $totalCount }} personas</span>
    </div>

    {{-- Filters --}}
    <div class="card mb-3 border-0 shadow-sm">
        <div class="card-body py-2">
            <div class="d-flex flex-wrap gap-2 align-items-center">
                <select wire:model.live="circleFilter" class="form-select form-select-sm" style="width: auto;">
                    <option value="">Todos los círculos</option>
                    @foreach ($circles as $circle)
                        <option value="{{ $circle->id }}">{{ $circle->name }}</option>
                    @endforeach
                </select>
                <div class="form-check form-check-inline">
                    <input type="checkbox" wire:model.live="showArchived" class="form-check-input" id="showArchived">
                    <label class="form-check-label small" for="showArchived">Mostrar archivados</label>
                </div>
            </div>
        </div>
    </div>

    {{-- Action Buttons --}}
    <div class="d-flex gap-2 mb-3">
        <button wire:click="openForm" class="btn btn-info text-white flex-grow-1">
            <i class="bi bi-person-plus"></i> Agregar Persona
        </button>
        <button wire:click="openCircleForm" class="btn btn-outline-info">
            <i class="bi bi-plus-circle"></i> Círculo
        </button>
    </div>

    {{-- Circle Form --}}
    @if ($showCircleForm)
        <div class="card mb-3 border-info">
            <div class="card-header bg-info bg-opacity-10 d-flex justify-content-between align-items-center">
                <h6 class="mb-0">Nuevo Círculo</h6>
                <button wire:click="closeCircleForm" class="btn-close btn-sm"></button>
            </div>
            <div class="card-body">
                <div class="row g-2 mb-3">
                    <div class="col-8">
                        <input type="text" wire:model="circleName" class="form-control" placeholder="Nombre del círculo">
                    </div>
                    <div class="col-4">
                        <div class="input-group">
                            <input type="number" wire:model="contactFrequencyDays" class="form-control" min="1">
                            <span class="input-group-text small">días</span>
                        </div>
                    </div>
                </div>
                <button wire:click="saveCircle" class="btn btn-info text-white w-100">
                    <i class="bi bi-check-lg"></i> Crear Círculo
                </button>
            </div>
        </div>
    @endif

    {{-- Person Form --}}
    @if ($showForm)
        <div class="card mb-3 border-info">
            <div class="card-header bg-info bg-opacity-10 d-flex justify-content-between align-items-center">
                <h6 class="mb-0">{{ $editingId ? 'Editar' : 'Nueva' }} Persona</h6>
                <button wire:click="closeForm" class="btn-close btn-sm"></button>
            </div>
            <div class="card-body">
                <div class="row g-2 mb-3">
                    <div class="col-7">
                        <label class="form-label">Nombre completo</label>
                        <input type="text" wire:model="fullName" class="form-control" placeholder="Nombre completo">
                    </div>
                    <div class="col-5">
                        <label class="form-label">Apodo</label>
                        <input type="text" wire:model="nickname" class="form-control" placeholder="Opcional">
                    </div>
                </div>
                <div class="row g-2 mb-3">
                    <div class="col-6">
                        <label class="form-label">Círculo</label>
                        <select wire:model="circleId" class="form-select">
                            <option value="">Sin círculo</option>
                            @foreach ($circles as $circle)
                                <option value="{{ $circle->id }}">{{ $circle->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-6">
                        <label class="form-label">Categoría</label>
                        <select wire:model="category" class="form-select">
                            <option value="">Sin categoría</option>
                            <option value="familia">Familia</option>
                            <option value="amigo">Amigo</option>
                            <option value="trabajo">Trabajo</option>
                            <option value="pareja">Pareja</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>
                </div>
                <div class="row g-2 mb-3">
                    <div class="col-6">
                        <label class="form-label">Mes cumpleaños</label>
                        <select wire:model="birthdayMonth" class="form-select">
                            <option value="">-</option>
                            @for ($m = 1; $m <= 12; $m++)
                                <option value="{{ $m }}">{{ \Carbon\Carbon::create(2000, $m, 1)->translatedFormat('F') }}</option>
                            @endfor
                        </select>
                    </div>
                    <div class="col-6">
                        <label class="form-label">Día</label>
                        <input type="number" wire:model="birthdayDay" class="form-control" min="1" max="31" placeholder="Día">
                    </div>
                </div>
                <button wire:click="save" class="btn btn-info text-white w-100">
                    <i class="bi bi-check-lg"></i> {{ $editingId ? 'Actualizar' : 'Guardar' }}
                </button>
            </div>
        </div>
    @endif

    {{-- Relationships List --}}
    @forelse ($relationships as $rel)
        <div class="card mb-2 border-0 shadow-sm {{ $rel->is_archived ? 'opacity-50' : '' }}">
            <div class="card-body py-2">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center gap-3">
                        <div class="rounded-circle bg-info bg-opacity-10 d-flex align-items-center justify-content-center"
                             style="width: 40px; height: 40px; min-width: 40px;">
                            <i class="bi bi-person-fill text-info"></i>
                        </div>
                        <div>
                            <div class="fw-medium">{{ $rel->full_name }}</div>
                            <div class="d-flex flex-wrap gap-1">
                                @if ($rel->circle)
                                    <span class="badge bg-info bg-opacity-10 text-info">{{ $rel->circle->name }}</span>
                                @endif
                                @if ($rel->category)
                                    <span class="badge bg-secondary bg-opacity-10 text-secondary">{{ $rel->category }}</span>
                                @endif
                                @if ($rel->birthday_month && $rel->birthday_day)
                                    <span class="badge bg-warning bg-opacity-10 text-warning">
                                        <i class="bi bi-cake2"></i> {{ $rel->birthday_day }}/{{ $rel->birthday_month }}
                                    </span>
                                @endif
                                @if ($rel->last_contact_at)
                                    <small class="text-muted">Contacto: {{ $rel->last_contact_at->diffForHumans() }}</small>
                                @endif
                            </div>
                        </div>
                    </div>
                    <div class="d-flex gap-1">
                        <button wire:click="markContact('{{ $rel->id }}')" class="btn btn-sm btn-outline-success" title="Marcar contacto">
                            <i class="bi bi-chat-dots"></i>
                        </button>
                        <button wire:click="openForm('{{ $rel->id }}')" class="btn btn-sm btn-outline-secondary">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button wire:click="toggleArchive('{{ $rel->id }}')" class="btn btn-sm btn-outline-warning" title="{{ $rel->is_archived ? 'Desarchivar' : 'Archivar' }}">
                            <i class="bi bi-archive"></i>
                        </button>
                        <button wire:click="delete('{{ $rel->id }}')" wire:confirm="¿Eliminar esta persona?" class="btn btn-sm btn-outline-danger">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    @empty
        <div class="text-center py-5 text-muted">
            <i class="bi bi-people" style="font-size: 3rem;"></i>
            <p class="mt-2 mb-0">Sin personas registradas</p>
        </div>
    @endforelse
</div>
