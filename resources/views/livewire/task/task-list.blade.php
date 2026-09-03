<div data-module="tasks" class="lt-page" x-data="{ showDialog: $wire.entangle('showForm'), showRecurringDialog: $wire.entangle('showRecurringCompletion') }">
    <x-page-header subtitle="Decide, ordena y completa el trabajo con claridad." :tabs="config('modules.tasks.tabs')" :preserve="config('modules.tasks.preserve')">
        <x-slot:controls>
            @php
                $activeFilterCount = collect([$dateFilter, $categoryFilter, $priorityFilter, $sizeFilter, $filter !== 'pending' ? $filter : ''])->filter()->count();
            @endphp
            <x-ui.filter-bar search="search" placeholder="Buscar tareas..." label="Filtros de tareas" class="tf-bar">
                <div class="tf-filters" x-data="{ panel: false }" @click.outside="panel = false" @keydown.escape="panel = false">
                    <button type="button" class="md-btn-outlined tf-btn {{ $activeFilterCount ? 'is-on' : '' }}"
                            :aria-expanded="panel" @click="panel = !panel">
                        <i class="bi bi-funnel" aria-hidden="true"></i> <span>Filtros</span>
                        @if ($activeFilterCount)
                            <span class="md-count-badge">{{ $activeFilterCount }}</span>
                        @endif
                    </button>
                    <template x-if="panel">
                        <div>
                            <button type="button" class="md-tf-scrim" aria-label="Cerrar los filtros" @click="panel = false"></button>
                            <div class="tf-pop">
                                <div class="tf-pop__head">
                                    <h3>Filtros</h3>
                                    @if ($activeFilterCount)
                                        <x-ui.action variant="text" size="sm" icon="bi-x-lg" wire:click="clearFilters">Limpiar</x-ui.action>
                                    @endif
                                    <span style="flex: 1;"></span>
                                    <x-ui.icon-action icon="bi-x-lg" label="Cerrar los filtros" size="sm" @click="panel = false" />
                                </div>
                                <div class="ltm-section">
                                    <span class="ltm-section__label">Cuándo</span>
                                    <div class="ltm-chips">
                                        @foreach (['hoy' => 'Hoy', 'vencidas' => 'Vencidas', 'proximas' => 'Próximas', 'sin-fecha' => 'Sin fecha'] as $value => $label)
                                            <x-ui.chip variant="filter" :selected="$dateFilter === $value"
                                                       wire:click="$set('dateFilter', '{{ $dateFilter === $value ? '' : $value }}')">{{ $label }}</x-ui.chip>
                                        @endforeach
                                    </div>
                                </div>
                                <div class="ltm-section">
                                    <span class="ltm-section__label">Categoría</span>
                                    <div class="ltm-chips">
                                        @foreach (['__none__' => 'Sin categoría'] + $categories as $value => $label)
                                            <x-ui.chip variant="filter" :selected="$categoryFilter === $value"
                                                       wire:click="$set('categoryFilter', '{{ $categoryFilter === $value ? '' : $value }}')">{{ $label }}</x-ui.chip>
                                        @endforeach
                                    </div>
                                </div>
                                <div class="ltm-section">
                                    <span class="ltm-section__label">Estado</span>
                                    <div class="ltm-chips">
                                        @foreach (['pending' => 'Pendientes', 'completed' => 'Completadas', 'all' => 'Todas'] as $value => $label)
                                            <x-ui.chip variant="filter" :selected="$filter === $value" wire:click="$set('filter', '{{ $value }}')">{{ $label }}</x-ui.chip>
                                        @endforeach
                                    </div>
                                </div>
                                <div class="ltm-section">
                                    <span class="ltm-section__label">Prioridad</span>
                                    <div class="ltm-chips">
                                        @foreach ($priorities as $value => $label)
                                            <x-ui.chip variant="filter" :selected="$priorityFilter === $value"
                                                       wire:click="$set('priorityFilter', '{{ $priorityFilter === $value ? '' : $value }}')">{{ $label }}</x-ui.chip>
                                        @endforeach
                                    </div>
                                </div>
                                <div class="ltm-section">
                                    <span class="ltm-section__label">Tamaño</span>
                                    <div class="ltm-chips">
                                        @foreach ($sizes as $value => $label)
                                            <x-ui.chip variant="filter" :selected="$sizeFilter === $value"
                                                       wire:click="$set('sizeFilter', '{{ $sizeFilter === $value ? '' : $value }}')">{{ $label }}</x-ui.chip>
                                        @endforeach
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </x-ui.filter-bar>
        </x-slot:controls>
    </x-page-header>

    <div class="lt-cols">
    <div class="lt-stack">
    {{-- Task List --}}
    <x-panel flush>
        {{-- Mientras se resuelve un filtro, una busqueda o un cambio de pagina
             se muestra la silueta de la lista en lugar de dejar la pantalla quieta. --}}
        <x-ui.skeleton variant="list" :lines="6" label="Cargando tareas"
                       wire:loading.delay
                       wire:target="filter,categoryFilter,priorityFilter,dateFilter,sizeFilter,search,gotoPage,previousPage,nextPage" />

        <div wire:loading.delay.remove wire:target="filter,categoryFilter,priorityFilter,dateFilter,sizeFilter,search,gotoPage,previousPage,nextPage">
        @forelse ($tasks as $task)
            <div class="md-list-item {{ $task->completed ? 'md-list-item--completed' : '' }}">
                <button wire:click="openForm('{{ $task->id }}')" class="md-list-item-content md-task-open-button" aria-label="Abrir tarea: {{ $task->title }}">
                    <div class="d-flex align-items-center gap-2">
                        <span class="md-list-item-headline {{ $task->completed ? '' : 'fw-medium' }}">
                            {{ $task->title }}
                        </span>
                        @if ($task->is_private)
                            <i class="bi bi-lock-fill" style="color: var(--md-sys-color-on-surface-variant); font-size: 0.75rem;"></i>
                        @endif
                    </div>
                    @if ($task->description)
                        <div class="md-list-item-supporting text-truncate">{{ $task->description }}</div>
                    @endif
                    <div class="d-flex flex-wrap gap-1 mt-1">
                        @if ($task->priority)
                            @php
                                $priorityChipClass = match($task->priority) {
                                    'urgent-important' => 'md-chip-tonal--error',
                                    'not-urgent-important' => 'md-chip-tonal--warning',
                                    'urgent-not-important' => 'md-chip-tonal--info',
                                    default => 'md-chip-tonal',
                                };
                            @endphp
                            <span class="md-chip-tonal {{ $priorityChipClass }}">{{ $priorities[$task->priority] ?? $task->priority }}</span>
                        @endif
                        @if ($task->category)
                            <span class="md-chip-tonal md-chip-tonal--primary">{{ $categories[$task->category] ?? $task->category }}</span>
                        @endif
                        @if ($task->size)
                            <span class="md-chip-tonal">{{ $task->size }}</span>
                        @endif
                        @if ($task->subtask_progress)
                            <span class="md-chip-tonal md-chip-tonal--info">
                                <i class="bi bi-check2-square" style="font-size: 0.625rem;"></i> {{ $task->subtask_progress['completed'] }}/{{ $task->subtask_progress['total'] }} subtareas
                            </span>
                        @endif
                        @if ($task->is_recurrent)
                            @php
                                $recurrence = $task->recurrence ?? [];
                                $recurrenceLabel = match ($recurrence['pattern'] ?? 'custom') {
                                    'daily' => 'Diaria',
                                    'weekly' => 'Semanal',
                                    'monthly' => 'Mensual',
                                    default => 'Cada '.max(1, (int) ($recurrence['customDays'] ?? 1)).' días',
                                };
                            @endphp
                            <span class="md-chip-tonal"><i class="bi bi-arrow-repeat" style="font-size: 0.625rem;"></i> {{ $recurrenceLabel }}</span>
                        @endif
                        @if (!$task->start_date && !$task->end_date)
                            <span class="md-chip-tonal">Sin fecha</span>
                        @else
                            @if (!$task->completed && ($task->end_date ?? $task->start_date)->isPast())
                                <span class="md-chip-tonal md-chip-tonal--error"><i class="bi bi-exclamation-circle" style="font-size: 0.625rem;"></i> Vencida</span>
                            @endif
                            <span class="md-chip-tonal">
                                <i class="bi bi-calendar" style="font-size: 0.625rem;"></i> {{ ($task->start_date ?? $task->end_date)->format('d M, H:i') }}@if($task->end_date && $task->start_date) – {{ $task->end_date->format('H:i') }}@endif
                            </span>
                        @endif
                        @if ($task->estimated_time)<span class="md-chip-tonal"><i class="bi bi-clock" style="font-size: 0.625rem;"></i> {{ $task->estimated_time_label }}</span>@endif
                    </div>
                </button>
                <div class="md-list-item-trailing">
                    <div class="ta-split" x-data="{ open: false }" @click.outside="open = false" @keydown.escape="open = false">
                        <button type="button" wire:click.stop="toggleComplete('{{ $task->id }}')" x-optimistic-toggle
                                class="md-btn-outlined ta-split__main">
                            <i class="bi {{ $task->completed ? 'bi-arrow-counterclockwise' : 'bi-check-lg' }}" aria-hidden="true"></i>
                            <span>{{ $task->completed ? 'Reabrir' : 'Completar' }}</span>
                        </button>
                        <button type="button" class="md-btn-outlined ta-split__more" aria-label="Más acciones de {{ $task->title }}"
                                :aria-expanded="open" @click.stop="open = !open">
                            <i class="bi bi-chevron-down" aria-hidden="true"></i>
                        </button>
                        <template x-if="open">
                            <div>
                                <button type="button" class="md-tf-scrim" aria-label="Cerrar el menú" @click="open = false"></button>
                                <div class="ta-menu" role="menu">
                                    <button type="button" role="menuitem" wire:click.stop="openForm('{{ $task->id }}')" @click="open = false">
                                        <i class="bi bi-pencil" aria-hidden="true"></i> Editar
                                    </button>
                                    <button type="button" role="menuitem" class="md-ta-menu__danger"
                                            wire:click.stop="delete('{{ $task->id }}')" wire:confirm="La tarea «{{ $task->title }}» se elimina de forma permanente."
                                            @click="open = false">
                                        <i class="bi bi-trash" aria-hidden="true"></i> Eliminar
                                    </button>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        @empty
            <div class="text-center py-5" style="color: var(--md-sys-color-on-surface-variant);">
                <i class="bi bi-list-task" style="font-size: 3rem; opacity: 0.4;"></i>
                <p class="md-body-large mt-3 mb-0">No hay tareas {{ $filter === 'pending' ? 'pendientes' : ($filter === 'completed' ? 'completadas' : '') }}</p>
            </div>
        @endforelse
        </div>
    </x-panel>

    <div>
        {{ $tasks->links() }}
    </div>
    </div>

    <div class="lt-stack">
        <x-panel title="Hoy" icon="bi-lightning-charge">
            <div style="display: grid; gap: 14px;">
                <div>
                    <p class="lt-figure" style="margin: 0 0 8px;"><strong>{{ $completedToday }}</strong><span>de {{ $plannedToday }} planificadas hoy</span></p>
                    <x-ui.progress :value="$plannedToday ? ($completedToday / $plannedToday) * 100 : 0" tone="success" label="Progreso de hoy" />
                </div>
                <dl class="lt-facts">
                    <div><dt>Pendientes</dt><dd>{{ $pendingCount }}</dd></div>
                    @if ($overdueCount > 0)
                        <div style="color: var(--md-sys-color-error);"><dt>Vencidas</dt><dd>{{ $overdueCount }}</dd></div>
                    @endif
                </dl>
            </div>
        </x-panel>
        @if (!empty($categoryBreakdown))
            <x-panel title="Completadas hoy" icon="bi-bar-chart">
                <dl class="lt-facts">
                    @foreach ($categoryBreakdown as $cat => $count)
                        <div><dt>{{ $categories[$cat] ?? $cat }}</dt><dd>{{ $count }}</dd></div>
                    @endforeach
                </dl>
            </x-panel>
        @endif
        <x-panel title="Vistas relacionadas" icon="bi-signpost-split">
            <div class="md-context-links">
                <a href="{{ route('tasks.planning') }}"><i class="bi bi-calendar-week"></i> Planificación</a>
                <a href="{{ route('tasks.progress') }}"><i class="bi bi-trophy"></i> Progreso</a>
            </div>
        </x-panel>
    </div>
    </div>

    <div class="lt-fab-zone">
        <x-module-actions fab-always
            :primary="['label' => 'Nueva tarea', 'icon' => 'bi-plus-lg', 'action' => 'openForm']" />
    </div>

    @include('livewire.task.partials.edit-task-dialog', [
        'dialogId' => 'task',
        'dialogTitle' => $editingId ? 'Editar tarea' : 'Nueva tarea',
        'saveLabel' => $editingId ? 'Actualizar' : 'Crear',
        'showRecurrenceFields' => true,
    ])

    @include('livewire.task.partials.recurring-completion-dialog')
</div>
