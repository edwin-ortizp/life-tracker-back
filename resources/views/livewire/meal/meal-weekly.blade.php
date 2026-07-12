<div>
    {{-- Header --}}
    <div class="d-flex align-items-center justify-content-between mb-4">
        <h4 class="mb-0"><i class="bi bi-egg-fried text-warning"></i> Comidas</h4>
        <div class="d-flex align-items-center gap-2">
            <button wire:click="previousWeek" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-chevron-left"></i>
            </button>
            <button wire:click="thisWeek" class="btn btn-sm btn-outline-primary">
                Esta semana
            </button>
            <span class="fw-medium">{{ $weekStart->format('d M') }} - {{ $weekStart->copy()->endOfWeek()->format('d M') }}</span>
            <button wire:click="nextWeek" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-chevron-right"></i>
            </button>
        </div>
    </div>

    {{-- Form Modal --}}
    @if ($showForm)
        <div class="card mb-3 border-warning">
            <div class="card-header bg-warning bg-opacity-10 d-flex justify-content-between align-items-center">
                <h6 class="mb-0">
                    {{ $editingId ? 'Editar' : 'Agregar' }} - {{ $mealTypes[$formMealType] ?? $formMealType }}
                    ({{ \Carbon\Carbon::parse($formDate)->translatedFormat('D d') }})
                </h6>
                <button wire:click="closeForm" class="btn-close btn-sm"></button>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <label class="form-label">Comida</label>
                    <input type="text" wire:model="formName" class="form-control" placeholder="¿Qué vas a comer?">
                </div>
                <div class="row g-2 mb-3">
                    <div class="col-8">
                        <label class="form-label">Notas</label>
                        <input type="text" wire:model="formNotes" class="form-control" placeholder="Opcional">
                    </div>
                    <div class="col-4">
                        <label class="form-label">Calorías</label>
                        <input type="number" wire:model="formCalories" class="form-control" placeholder="kcal">
                    </div>
                </div>
                <button wire:click="save" class="btn btn-warning w-100">
                    <i class="bi bi-check-lg"></i> {{ $editingId ? 'Actualizar' : 'Guardar' }}
                </button>
            </div>
        </div>
    @endif

    {{-- Weekly Grid --}}
    <div class="table-responsive">
        <table class="table table-bordered align-middle">
            <thead class="table-light">
                <tr>
                    <th style="width: 100px;"></th>
                    @foreach ($weekDates as $date)
                        <th class="text-center {{ $date->isToday() ? 'table-primary' : '' }}">
                            <div class="small">{{ $date->translatedFormat('D') }}</div>
                            <div class="fw-bold">{{ $date->format('d') }}</div>
                        </th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach ($mealTypes as $typeKey => $typeLabel)
                    <tr>
                        <td class="fw-medium small">{{ $typeLabel }}</td>
                        @foreach ($weekDates as $date)
                            @php
                                $key = $date->format('Y-m-d') . '|' . $typeKey;
                                $entry = $entries->get($key)?->first();
                            @endphp
                            <td class="text-center p-1 {{ $date->isToday() ? 'table-primary' : '' }}" style="cursor: pointer; min-width: 100px;"
                                wire:click="openForm('{{ $date->format('Y-m-d') }}', '{{ $typeKey }}')">
                                @if ($entry)
                                    <div class="small fw-medium text-truncate" style="max-width: 90px;" title="{{ $entry->name }}">
                                        {{ $entry->name }}
                                    </div>
                                    @if ($entry->calories)
                                        <small class="text-muted">{{ $entry->calories }} kcal</small>
                                    @endif
                                @else
                                    <small class="text-muted">+</small>
                                @endif
                            </td>
                        @endforeach
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
</div>
