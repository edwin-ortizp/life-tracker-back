<x-module-shell module="goals" x-data="{ showDialog: $wire.entangle('showForm'), openMenu: null }">
    <x-slot:actions>
        <x-module-actions :primary="['label' => 'Nuevo objetivo', 'icon' => 'bi-plus-lg', 'action' => 'openForm']" />
    </x-slot:actions>

    <div class="md-summary-strip mb-3" aria-label="Resumen de objetivos">
        <span class="md-count-badge--primary">{{ $activeCount }} activos</span>
        <span class="md-count-badge--success">{{ $completedCount }} completados</span>
    </div>

    {{-- Filters --}}
    <div class="md-chip-group mb-3">
        <button wire:click="$set('statusFilter', 'active')" class="md-chip md-chip-filter {{ $statusFilter === 'active' ? 'selected' : '' }}">
            Activos
        </button>
        <button wire:click="$set('statusFilter', 'completed')" class="md-chip md-chip-filter {{ $statusFilter === 'completed' ? 'selected' : '' }}">
            Completados
        </button>
        <button wire:click="$set('statusFilter', 'abandoned')" class="md-chip md-chip-filter {{ $statusFilter === 'abandoned' ? 'selected' : '' }}">
            Abandonados
        </button>
        <button wire:click="$set('statusFilter', 'all')" class="md-chip md-chip-filter {{ $statusFilter === 'all' ? 'selected' : '' }}">
            Todos
        </button>
    </div>

    {{-- Goals List --}}
    @forelse ($goals as $goal)
        <div class="md-card-outlined mb-2">
            <div class="d-flex align-items-start justify-content-between">
                <a href="{{ route('goals.show', $goal) }}" wire:navigate class="flex-grow-1 text-decoration-none" style="min-width: 0; color: inherit;">
                    <div class="d-flex align-items-center gap-2">
                        @if ($goal->status === 'active')
                            <i class="bi bi-flag-fill" style="color: var(--md-sys-color-primary);"></i>
                        @elseif ($goal->status === 'completed')
                            <i class="bi bi-check-circle-fill" style="color: var(--md-custom-color-success);"></i>
                        @else
                            <i class="bi bi-x-circle-fill" style="color: var(--md-sys-color-outline);"></i>
                        @endif
                        <span class="md-title-medium" style="color: var(--md-sys-color-on-surface);">{{ $goal->title }}</span>
                    </div>
                    @if ($goal->description)
                        <p class="md-body-small mt-1 mb-1" style="color: var(--md-sys-color-on-surface-variant);">{{ $goal->description }}</p>
                    @endif
                    <div class="d-flex gap-2 mt-1 flex-wrap-wrap">
                        @if ($goal->start_date)
                            <span class="md-chip-tonal"><i class="bi bi-calendar" style="font-size: 0.625rem;"></i> {{ $goal->start_date->format('d M Y') }}</span>
                        @endif
                        @if ($goal->due_date)
                            <span class="md-chip-tonal {{ $goal->due_date->isPast() && $goal->status === 'active' ? 'md-chip-tonal--error' : '' }}">
                                <i class="bi bi-calendar-event" style="font-size: 0.625rem;"></i> {{ $goal->due_date->format('d M Y') }}
                            </span>
                        @endif
                    </div>
                </a>
                <div class="position-relative">
                    <button class="md-btn-icon" @click="openMenu = openMenu === '{{ $goal->id }}' ? null : '{{ $goal->id }}'">
                        <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    <div x-show="openMenu === '{{ $goal->id }}'" @click.outside="openMenu = null"
                         x-transition
                         style="position: absolute; right: 0; top: 40px; background: var(--md-sys-color-surface-container); border-radius: var(--md-sys-shape-corner-extra-small); box-shadow: var(--md-sys-elevation-2); z-index: 10; min-width: 180px; padding: 4px 0; display: none;">
                        <button wire:click="openForm('{{ $goal->id }}')" @click="openMenu = null"
                                style="width: 100%; padding: 8px 16px; background: none; border: none; text-align: left; cursor: pointer; color: var(--md-sys-color-on-surface); font-size: 0.875rem; display: flex; align-items: center; gap: 12px;"
                                onmouseover="this.style.background='color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)'"
                                onmouseout="this.style.background='none'">
                            <i class="bi bi-pencil"></i> Editar
                        </button>
                        @if ($goal->status === 'active')
                            <button wire:click="updateStatus('{{ $goal->id }}', 'completed')" @click="openMenu = null"
                                    style="width: 100%; padding: 8px 16px; background: none; border: none; text-align: left; cursor: pointer; color: var(--md-custom-color-success); font-size: 0.875rem; display: flex; align-items: center; gap: 12px;"
                                    onmouseover="this.style.background='color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)'"
                                    onmouseout="this.style.background='none'">
                                <i class="bi bi-check-circle"></i> Completar
                            </button>
                            <button wire:click="updateStatus('{{ $goal->id }}', 'abandoned')" @click="openMenu = null"
                                    style="width: 100%; padding: 8px 16px; background: none; border: none; text-align: left; cursor: pointer; color: var(--md-custom-color-warning); font-size: 0.875rem; display: flex; align-items: center; gap: 12px;"
                                    onmouseover="this.style.background='color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)'"
                                    onmouseout="this.style.background='none'">
                                <i class="bi bi-x-circle"></i> Abandonar
                            </button>
                        @else
                            <button wire:click="updateStatus('{{ $goal->id }}', 'active')" @click="openMenu = null"
                                    style="width: 100%; padding: 8px 16px; background: none; border: none; text-align: left; cursor: pointer; color: var(--md-sys-color-primary); font-size: 0.875rem; display: flex; align-items: center; gap: 12px;"
                                    onmouseover="this.style.background='color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)'"
                                    onmouseout="this.style.background='none'">
                                <i class="bi bi-arrow-counterclockwise"></i> Reactivar
                            </button>
                        @endif
                        <div style="height: 1px; background: var(--md-sys-color-surface-variant); margin: 4px 0;"></div>
                        <button wire:click="delete('{{ $goal->id }}')" wire:confirm="¿Eliminar este objetivo?" @click="openMenu = null"
                                style="width: 100%; padding: 8px 16px; background: none; border: none; text-align: left; cursor: pointer; color: var(--md-sys-color-error); font-size: 0.875rem; display: flex; align-items: center; gap: 12px;"
                                onmouseover="this.style.background='color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)'"
                                onmouseout="this.style.background='none'">
                            <i class="bi bi-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    @empty
        <div class="text-center py-5" style="color: var(--md-sys-color-on-surface-variant);">
            <i class="bi bi-flag" style="font-size: 3rem; opacity: 0.4;"></i>
            <p class="md-body-large mt-3 mb-0">Sin objetivos {{ $statusFilter !== 'all' ? $statusFilter . 's' : '' }}</p>
        </div>
    @endforelse

    {{-- Dialog --}}
    <template x-if="showDialog">
        <div>
            <div class="md-dialog-scrim" @click="showDialog = false"></div>
            <div class="md-dialog" @click.stop>
                <h2 class="md-dialog-headline md-headline-small">{{ $editingId ? 'Editar' : 'Nuevo' }} Objetivo</h2>
                <div class="md-dialog-content">
                    <div class="d-flex flex-column gap-3">
                        <div class="md-text-field">
                            <input type="text" wire:model="title" placeholder=" " id="goal-title">
                            <label for="goal-title">Título</label>
                        </div>
                        <div class="md-text-field">
                            <textarea wire:model="description" placeholder=" " id="goal-desc" rows="2"></textarea>
                            <label for="goal-desc">Descripción</label>
                        </div>
                        <div class="row g-3">
                            <div class="col-12">
                                <div class="md-text-field">
                                    <select wire:model="formStatus" id="goal-status">
                                        <option value="active">Activo</option>
                                        <option value="completed">Completado</option>
                                        <option value="abandoned">Abandonado</option>
                                    </select>
                                    <label for="goal-status">Estado</label>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="md-text-field">
                                    <input type="date" wire:model="startDate" placeholder=" " id="goal-start">
                                    <label for="goal-start">Fecha inicio</label>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="md-text-field">
                                    <input type="date" wire:model="dueDate" placeholder=" " id="goal-due">
                                    <label for="goal-due">Fecha límite</label>
                                </div>
                            </div>
                        </div>
                        <label class="goal-kpi-toggle mt-1">
                            <input wire:model.live="kpiEnabled" type="checkbox">
                            <span><i class="bi bi-graph-up-arrow"></i> Configurar KPI único</span>
                        </label>
                        @if ($kpiEnabled)
                            <div class="goal-kpi-form">
                                <div class="md-text-field">
                                    <input wire:model="kpiName" placeholder=" " id="goal-kpi-name">
                                    <label for="goal-kpi-name">Nombre del KPI</label>
                                    @error('kpiName')<small class="text-danger">{{ $message }}</small>@enderror
                                </div>
                                <div class="md-text-field">
                                    <input wire:model="kpiUnit" placeholder=" " id="goal-kpi-unit">
                                    <label for="goal-kpi-unit">Unidad</label>
                                    @error('kpiUnit')<small class="text-danger">{{ $message }}</small>@enderror
                                </div>
                                <div class="md-text-field">
                                    <select wire:model="kpiDirection" id="goal-kpi-direction">
                                        <option value="increase">Aumentar hasta la meta</option>
                                        <option value="decrease">Reducir hasta la meta</option>
                                    </select>
                                    <label for="goal-kpi-direction">Dirección</label>
                                </div>
                                <div class="md-text-field">
                                    <input wire:model="kpiStartValue" type="number" step="0.01" placeholder=" " id="goal-kpi-start">
                                    <label for="goal-kpi-start">Valor inicial</label>
                                    @error('kpiStartValue')<small class="text-danger">{{ $message }}</small>@enderror
                                </div>
                                <div class="md-text-field">
                                    <input wire:model="kpiTargetValue" type="number" step="0.01" placeholder=" " id="goal-kpi-target">
                                    <label for="goal-kpi-target">Valor objetivo</label>
                                    @error('kpiTargetValue')<small class="text-danger">{{ $message }}</small>@enderror
                                </div>
                                <p class="goal-kpi-form__hint">Con fechas de inicio y límite, el detalle comparará el avance real con el ritmo esperado.</p>
                            </div>
                        @endif
                    </div>
                </div>
                <div class="md-dialog-actions">
                    <button @click="showDialog = false" class="md-btn-text">Cancelar</button>
                    <button wire:click="save" class="md-btn-filled">
                        <i class="bi bi-check-lg"></i> {{ $editingId ? 'Actualizar' : 'Crear' }}
                    </button>
                </div>
            </div>
        </div>
    </template>
</x-module-shell>
