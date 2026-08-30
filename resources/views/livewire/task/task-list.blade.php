<div data-module="tasks" class="lt-page" x-data="{ showDialog: $wire.entangle('showForm'), showBulkDialog: $wire.entangle('showBulkForm'), showRecurringDialog: $wire.entangle('showRecurringCompletion') }">
    <x-page-header subtitle="Decide, ordena y completa el trabajo con claridad." :tabs="config('modules.tasks.tabs')" :preserve="config('modules.tasks.preserve')">
        <x-slot:controls>
            <x-ui.filter-bar search="search" placeholder="Buscar tareas..." label="Filtros de tareas">
                <x-slot:chips>
                    @foreach (['pending' => 'Pendientes', 'completed' => 'Completadas', 'all' => 'Todas'] as $value => $label)
                        <x-ui.chip variant="filter" :selected="$filter === '{{ $value }}'" wire:click="$set('filter', '{{ $value }}')">{{ $label }}</x-ui.chip>
                    @endforeach

                    <div class="md-chip-rail__divider"></div>

                    @foreach (['hoy' => 'Hoy', 'vencidas' => 'Vencidas', 'proximas' => 'Próximas', 'sin-fecha' => 'Sin fecha'] as $value => $label)
                        <x-ui.chip variant="filter" :selected="$dateFilter === '{{ $value }}'"
                                   wire:click="$set('dateFilter', '{{ $dateFilter === $value ? '' : $value }}')">{{ $label }}</x-ui.chip>
                    @endforeach

                    <div class="md-chip-rail__divider"></div>

                    <x-ui.filter-menu name="categoryFilter" label="Categoría" allLabel="Todas"
                                      :options="['__none__' => 'Sin categoría'] + $categories"
                                      :selected="$categoryFilter" />

                    <x-ui.filter-menu name="priorityFilter" label="Prioridad" allLabel="Todas"
                                      :options="$priorities" :selected="$priorityFilter" />

                    <x-ui.filter-menu name="sizeFilter" label="Tamaño" allLabel="Todos" align="end"
                                      :options="$sizes" :selected="$sizeFilter" />
                </x-slot:chips>
            </x-ui.filter-bar>
        </x-slot:controls>
    </x-page-header>

    <div class="lt-cols">
    <div class="lt-stack">
    {{-- Task List --}}
    <x-panel flush>
        @forelse ($tasks as $task)
            <div class="md-list-item {{ $task->completed ? 'md-list-item--completed' : '' }}">
                <div class="md-list-item-leading">
                    <button wire:click.stop="toggleComplete('{{ $task->id }}')"
                            class="md-list-checkbox {{ $task->completed ? 'checked' : '' }}">
                        @if ($task->completed)
                            <i class="bi bi-check-lg"></i>
                        @endif
                    </button>
                </div>
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
                    <button wire:click.stop="openForm('{{ $task->id }}')" class="md-btn-icon" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button wire:click.stop="delete('{{ $task->id }}')" wire:confirm="¿Eliminar esta tarea?" class="md-btn-icon" title="Eliminar" style="color: var(--md-sys-color-error);">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        @empty
            <div class="text-center py-5" style="color: var(--md-sys-color-on-surface-variant);">
                <i class="bi bi-list-task" style="font-size: 3rem; opacity: 0.4;"></i>
                <p class="md-body-large mt-3 mb-0">No hay tareas {{ $filter === 'pending' ? 'pendientes' : ($filter === 'completed' ? 'completadas' : '') }}</p>
            </div>
        @endforelse
    </x-panel>

    <div>
        {{ $tasks->links() }}
    </div>
    </div>

    <div class="lt-stack">
        <x-panel title="Hoy" icon="bi-lightning-charge">
            <div class="text-center mb-2">
                <span style="font-size: 2rem; font-weight: 700; color: var(--md-sys-color-primary);">{{ $completedToday }}</span>
                <span class="md-body-small d-block" style="color: var(--md-sys-color-on-surface-variant);">completadas hoy</span>
            </div>
            <dl class="lt-facts">
                <div><dt>Planificadas hoy</dt><dd>{{ $plannedToday }}</dd></div>
                <div><dt>Pendientes</dt><dd>{{ $pendingCount }}</dd></div>
                @if ($overdueCount > 0)
                    <div style="color: var(--md-sys-color-error);"><dt>Vencidas</dt><dd>{{ $overdueCount }}</dd></div>
                @endif
            </dl>
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
            :primary="['label' => 'Nueva tarea', 'icon' => 'bi-plus-lg', 'action' => 'openForm']"
            :secondary="[['label' => 'Varias tareas', 'icon' => 'bi-list-stars', 'action' => 'openBulkForm']]" />
    </div>

    @include('livewire.task.partials.edit-task-dialog', [
        'dialogId' => 'task',
        'dialogTitle' => $editingId ? 'Editar tarea' : 'Nueva tarea',
        'saveLabel' => $editingId ? 'Actualizar' : 'Crear',
        'showRecurrenceFields' => true,
    ])

    {{-- Dialog: Create several tasks --}}
    <template x-if="showBulkDialog">
        <div>
            <div class="md-dialog-scrim" wire:click="closeBulkForm"></div>
            <div class="md-dialog md-dialog--wide" @click.stop>
                <h2 class="md-dialog-headline md-headline-small">Crear varias tareas</h2>
                <div class="md-dialog-content">
                    <div class="d-flex flex-column gap-3">
                        <p class="md-body-medium mb-0">Escribe una tarea por línea. Los demás campos se aplicarán a todas.</p>
                        <div class="md-text-field">
                            <textarea wire:model="bulkTitles" placeholder=" " id="bulk-task-titles" rows="6"></textarea>
                            <label for="bulk-task-titles">Tareas</label>
                            @error('bulkTitles')
                                <div class="md-supporting-text" style="color: var(--md-sys-color-error);">{{ $message }}</div>
                            @enderror
                        </div>
                        @include('partials.markdown-editor', [
                            'model' => 'bulkDescription',
                            'mode' => 'bulkDescriptionMode',
                            'modeValue' => $bulkDescriptionMode,
                            'content' => $bulkDescription,
                            'id' => 'bulk-task-desc',
                            'placeholder' => 'Descripción común. Admite Markdown.',
                            'rows' => 3,
                        ])
                        <div class="row g-3">
                            <div class="col-md-4">
                                <div class="md-text-field">
                                    <select wire:model="bulkCategory" id="bulk-task-cat">
                                        <option value="">Sin categoría</option>
                                        @foreach ($categories as $key => $label)<option value="{{ $key }}">{{ $label }}</option>@endforeach
                                    </select>
                                    <label for="bulk-task-cat">Categoría</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="md-text-field">
                                    <select wire:model="bulkPriority" id="bulk-task-pri">
                                        <option value="">Sin prioridad</option>
                                        @foreach ($priorities as $key => $label)<option value="{{ $key }}">{{ $label }}</option>@endforeach
                                    </select>
                                    <label for="bulk-task-pri">Prioridad</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="md-text-field">
                                    <select wire:model="bulkSize" id="bulk-task-size">
                                        <option value="">Sin tamaño</option>
                                        @foreach ($sizes as $key => $label)<option value="{{ $key }}">{{ $label }}</option>@endforeach
                                    </select>
                                    <label for="bulk-task-size">Tamaño</label>
                                </div>
                            </div>
                        </div>
                        @include('livewire.task.partials.schedule-fields', ['idPrefix' => 'bulk-task', 'startModel' => 'bulkStartDate', 'startTimeModel' => 'bulkStartTime', 'endModel' => 'bulkEndDate', 'endTimeModel' => 'bulkEndTime', 'durationAction' => 'applyBulkDuration', 'estimatedTime' => $bulkEstimatedTime])
                        <label class="md-checkbox"><input type="checkbox" wire:model="bulkIsPrivate"><i class="bi bi-lock"></i> Tareas privadas</label>
                    </div>
                </div>
                <div class="md-dialog-actions">
                    <button wire:click="closeBulkForm" class="md-btn-text">Cancelar</button>
                    <button wire:click="saveBulk" class="md-btn-filled"><i class="bi bi-check-lg"></i> Crear tareas</button>
                </div>
            </div>
        </div>
    </template>

    @include('livewire.task.partials.recurring-completion-dialog')
</div>
