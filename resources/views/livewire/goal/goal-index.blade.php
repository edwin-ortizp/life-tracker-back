@php
    use App\Support\Ui\DataState;

    $goalsState = DataState::resolve(
        visible: $goals->count(),
        total: $statusFilter === 'all' ? $goals->count() : 1,
    );

    $statusLabels = ['active' => 'Activos', 'completed' => 'Completados', 'abandoned' => 'Abandonados', 'all' => 'Todos'];
@endphp

<x-module-shell module="goals" x-data="{ showDialog: $wire.entangle('showForm'), openMenu: null }">
    <x-slot:actions>
        <x-module-actions :primary="['label' => 'Nuevo objetivo', 'icon' => 'bi-plus-lg', 'action' => 'openForm']" />
    </x-slot:actions>

    <x-slot:controls>
        <x-ui.filter-bar label="Estado de los objetivos">
            <x-slot:chips>
                @foreach ($statusLabels as $value => $label)
                    <x-ui.chip variant="filter" :selected="$statusFilter === $value" wire:click="$set('statusFilter', '{{ $value }}')">{{ $label }}</x-ui.chip>
                @endforeach
            </x-slot:chips>
        </x-ui.filter-bar>
    </x-slot:controls>

    <x-ui.metric-grid label="Resumen de objetivos">
        <x-ui.metric label="Activos" icon="bi-flag-fill" tone="primary" :value="$activeCount" />
        <x-ui.metric label="Completados" icon="bi-check-circle-fill" tone="success" :value="$completedCount" />
    </x-ui.metric-grid>

    <x-ui.section title="Objetivos" :level="2">
        @if ($goalsState === DataState::CONTENT)
            <x-ui.list label="Objetivos">
                @foreach ($goals as $goal)
                    <x-ui.list-item :headline="$goal->title" :supporting="$goal->description" wire:key="goal-{{ $goal->id }}">
                        <x-slot:leading>
                            @if ($goal->status === 'active')
                                <x-ui.icon name="bi-flag-fill" tone="primary" label="Objetivo activo" />
                            @elseif ($goal->status === 'completed')
                                <x-ui.icon name="bi-check-circle-fill" tone="success" label="Objetivo completado" />
                            @else
                                <x-ui.icon name="bi-x-circle-fill" tone="muted" label="Objetivo abandonado" />
                            @endif
                        </x-slot:leading>

                        <div class="goal-card__meta">
                            @if ($goal->start_date)
                                <x-ui.chip variant="tonal" icon="bi-calendar">{{ $goal->start_date->format('d M Y') }}</x-ui.chip>
                            @endif
                            @if ($goal->due_date)
                                <x-ui.chip variant="tonal" icon="bi-calendar-event"
                                           :tone="$goal->due_date->isPast() && $goal->status === 'active' ? 'danger' : 'neutral'">
                                    {{ $goal->due_date->format('d M Y') }}
                                </x-ui.chip>
                            @endif
                        </div>

                        <x-slot:trailing>
                            <div class="md-chip-menu" :class="{ 'open': openMenu === '{{ $goal->id }}' }">
                                <x-ui.icon-action icon="bi-three-dots-vertical" label="Acciones del objetivo {{ $goal->title }}"
                                                  x-on:click="openMenu = openMenu === '{{ $goal->id }}' ? null : '{{ $goal->id }}'"
                                                  x-bind:aria-expanded="openMenu === '{{ $goal->id }}'" aria-haspopup="menu" />

                                <div x-show="openMenu === '{{ $goal->id }}'" @click.outside="openMenu = null" x-transition x-cloak
                                     class="md-chip-menu__dropdown md-chip-menu--end" role="menu">
                                    <button type="button" class="md-chip-menu__item" role="menuitem"
                                            wire:click="openForm('{{ $goal->id }}')" @click="openMenu = null">
                                        <i class="bi bi-pencil" aria-hidden="true"></i> Editar
                                    </button>

                                    @if ($goal->status === 'active')
                                        <button type="button" class="md-chip-menu__item md-chip-menu__item--success" role="menuitem"
                                                wire:click="updateStatus('{{ $goal->id }}', 'completed')" @click="openMenu = null">
                                            <i class="bi bi-check-circle" aria-hidden="true"></i> Completar
                                        </button>
                                        <button type="button" class="md-chip-menu__item md-chip-menu__item--warning" role="menuitem"
                                                wire:click="updateStatus('{{ $goal->id }}', 'abandoned')" @click="openMenu = null">
                                            <i class="bi bi-x-circle" aria-hidden="true"></i> Abandonar
                                        </button>
                                    @else
                                        <button type="button" class="md-chip-menu__item md-chip-menu__item--primary" role="menuitem"
                                                wire:click="updateStatus('{{ $goal->id }}', 'active')" @click="openMenu = null">
                                            <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Reactivar
                                        </button>
                                    @endif

                                    <div class="md-divider"></div>

                                    <button type="button" class="md-chip-menu__item md-chip-menu__item--danger" role="menuitem"
                                            wire:click="delete('{{ $goal->id }}')" wire:confirm="¿Eliminar este objetivo?" @click="openMenu = null">
                                        <i class="bi bi-trash" aria-hidden="true"></i> Eliminar
                                    </button>
                                </div>
                            </div>
                        </x-slot:trailing>
                    </x-ui.list-item>
                @endforeach
            </x-ui.list>
        @elseif ($goalsState === DataState::FILTERED_EMPTY)
            <x-ui.state variant="filtered-empty" icon="bi-flag"
                        message="No hay objetivos con el estado «{{ $statusLabels[$statusFilter] ?? $statusFilter }}».">
                <x-slot:actions>
                    <x-ui.action variant="outlined" icon="bi-x-circle" wire:click="$set('statusFilter', 'all')">Ver todos</x-ui.action>
                </x-slot:actions>
            </x-ui.state>
        @else
            <x-ui.state variant="empty" icon="bi-flag" title="Sin objetivos todavía"
                        message="Define un objetivo para seguir su avance y sus hitos.">
                <x-slot:actions>
                    <x-ui.action variant="filled" icon="bi-plus-lg" wire:click="openForm">Nuevo objetivo</x-ui.action>
                </x-slot:actions>
            </x-ui.state>
        @endif
    </x-ui.section>

    <x-ui.dialog state="showDialog" title="{{ $editingId ? 'Editar objetivo' : 'Nuevo objetivo' }}">
        <x-ui.field name="title" label="Título" wire:model="title" />
        <x-ui.textarea name="description" label="Descripción" rows="2" wire:model="description" />

        <x-ui.select name="formStatus" label="Estado"
                     :options="['active' => 'Activo', 'completed' => 'Completado', 'abandoned' => 'Abandonado']"
                     wire:model="formStatus" />

        <div class="md-field-pair">
            <x-ui.field name="startDate" label="Fecha inicio" type="date" wire:model="startDate" />
            <x-ui.field name="dueDate" label="Fecha límite" type="date" wire:model="dueDate" />
        </div>

        <label class="goal-kpi-toggle">
            <input wire:model.live="kpiEnabled" type="checkbox">
            <span><i class="bi bi-graph-up-arrow" aria-hidden="true"></i> Configurar KPI único</span>
        </label>

        @if ($kpiEnabled)
            <div class="goal-kpi-form">
                <x-ui.field name="kpiName" label="Nombre del KPI" wire:model="kpiName" />
                <x-ui.field name="kpiUnit" label="Unidad" wire:model="kpiUnit" />

                <x-ui.select name="kpiDirection" label="Dirección"
                             :options="['increase' => 'Aumentar hasta la meta', 'decrease' => 'Reducir hasta la meta']"
                             wire:model="kpiDirection" />

                <div class="md-field-pair">
                    <x-ui.field name="kpiStartValue" label="Valor inicial" type="number" step="0.01" wire:model="kpiStartValue" />
                    <x-ui.field name="kpiTargetValue" label="Valor objetivo" type="number" step="0.01" wire:model="kpiTargetValue" />
                </div>

                <p class="goal-kpi-form__hint">Con fechas de inicio y límite, el detalle comparará el avance real con el ritmo esperado.</p>
            </div>
        @endif

        <x-slot:actions>
            <x-ui.action variant="text" x-on:click="showDialog = false">Cancelar</x-ui.action>
            <x-ui.action variant="filled" icon="bi-check-lg" wire:click="save">{{ $editingId ? 'Actualizar' : 'Crear' }}</x-ui.action>
        </x-slot:actions>
    </x-ui.dialog>
</x-module-shell>
