<x-module-shell module="tasks" x-data="{ showDialog: $wire.entangle('showForm'), showBulkDialog: $wire.entangle('showBulkForm'), showRecurringDialog: $wire.entangle('showRecurringCompletion') }">
    <x-slot:actions>
        <x-module-actions
            :primary="['label' => 'Nueva tarea', 'icon' => 'bi-plus-lg', 'action' => 'openForm']"
            :secondary="[['label' => 'Varias tareas', 'icon' => 'bi-list-stars', 'action' => 'openBulkForm']]" />
    </x-slot:actions>

    {{-- Search + Filters --}}
    <div x-data="{ openMenu: null }" @click.outside="openMenu = null" class="mb-3">
        {{-- Search bar --}}
        <div class="md-search-bar mb-2">
            <i class="bi bi-search md-search-bar__icon"></i>
            <input type="text" wire:model.live.debounce.300ms="search"
                   class="md-search-bar__input" placeholder="Buscar tareas...">
            @if($search)
                <button wire:click="$set('search', '')" class="md-search-bar__clear">
                    <i class="bi bi-x-lg"></i>
                </button>
            @endif
        </div>

        {{-- Chip rail --}}
        <div class="md-chip-rail">
            {{-- Status --}}
            <button wire:click="$set('filter', 'pending')"
                    class="md-chip md-chip-filter {{ $filter === 'pending' ? 'selected' : '' }}">
                Pendientes
            </button>
            <button wire:click="$set('filter', 'completed')"
                    class="md-chip md-chip-filter {{ $filter === 'completed' ? 'selected' : '' }}">
                Completadas
            </button>
            <button wire:click="$set('filter', 'all')"
                    class="md-chip md-chip-filter {{ $filter === 'all' ? 'selected' : '' }}">
                Todas
            </button>

            <div class="md-chip-rail__divider"></div>

            {{-- Date --}}
            <button wire:click="$set('dateFilter', '{{ $dateFilter === 'hoy' ? '' : 'hoy' }}')"
                    class="md-chip md-chip-filter {{ $dateFilter === 'hoy' ? 'selected' : '' }}">
                Hoy
            </button>
            <button wire:click="$set('dateFilter', '{{ $dateFilter === 'vencidas' ? '' : 'vencidas' }}')"
                    class="md-chip md-chip-filter {{ $dateFilter === 'vencidas' ? 'selected' : '' }}">
                Vencidas
            </button>
            <button wire:click="$set('dateFilter', '{{ $dateFilter === 'proximas' ? '' : 'proximas' }}')"
                    class="md-chip md-chip-filter {{ $dateFilter === 'proximas' ? 'selected' : '' }}">
                Próximas
            </button>
            <button wire:click="$set('dateFilter', '{{ $dateFilter === 'sin-fecha' ? '' : 'sin-fecha' }}')"
                    class="md-chip md-chip-filter {{ $dateFilter === 'sin-fecha' ? 'selected' : '' }}">
                Sin fecha
            </button>

            <div class="md-chip-rail__divider"></div>

            {{-- Category chip-menu --}}
            <div class="md-chip-menu" :class="{ 'open': openMenu === 'category' }">
                <button @click="openMenu = openMenu === 'category' ? null : 'category'"
                        class="md-chip md-chip-filter {{ $categoryFilter ? 'selected' : '' }}">
                    {{ $categoryFilter ? ($categoryFilter === '__none__' ? 'Sin categoría' : ($categories[$categoryFilter] ?? 'Categoría')) : 'Categoría' }}
                    <i class="bi bi-chevron-down md-chip-menu__arrow"></i>
                </button>
                <div x-show="openMenu === 'category'"
                     x-transition:enter="transition ease-out duration-100"
                     x-transition:enter-start="opacity-0 scale-95"
                     x-transition:enter-end="opacity-100 scale-100"
                     x-transition:leave="transition ease-in duration-75"
                     x-transition:leave-start="opacity-100 scale-100"
                     x-transition:leave-end="opacity-0 scale-95"
                     class="md-chip-menu__dropdown" x-cloak>
                    <button wire:click="$set('categoryFilter', '')" @click="openMenu = null"
                            class="md-chip-menu__item {{ $categoryFilter === '' ? 'active' : '' }}">
                        Todas
                    </button>
                    <button wire:click="$set('categoryFilter', '__none__')" @click="openMenu = null"
                            class="md-chip-menu__item {{ $categoryFilter === '__none__' ? 'active' : '' }}">
                        Sin categoría
                    </button>
                    @foreach ($categories as $key => $label)
                        <button wire:click="$set('categoryFilter', '{{ $key }}')" @click="openMenu = null"
                                class="md-chip-menu__item {{ $categoryFilter === $key ? 'active' : '' }}">
                            {{ $label }}
                        </button>
                    @endforeach
                </div>
            </div>

            {{-- Priority chip-menu --}}
            <div class="md-chip-menu" :class="{ 'open': openMenu === 'priority' }">
                <button @click="openMenu = openMenu === 'priority' ? null : 'priority'"
                        class="md-chip md-chip-filter {{ $priorityFilter ? 'selected' : '' }}">
                    {{ $priorityFilter ? $priorities[$priorityFilter] : 'Prioridad' }}
                    <i class="bi bi-chevron-down md-chip-menu__arrow"></i>
                </button>
                <div x-show="openMenu === 'priority'"
                     x-transition:enter="transition ease-out duration-100"
                     x-transition:enter-start="opacity-0 scale-95"
                     x-transition:enter-end="opacity-100 scale-100"
                     x-transition:leave="transition ease-in duration-75"
                     x-transition:leave-start="opacity-100 scale-100"
                     x-transition:leave-end="opacity-0 scale-95"
                     class="md-chip-menu__dropdown" x-cloak>
                    <button wire:click="$set('priorityFilter', '')" @click="openMenu = null"
                            class="md-chip-menu__item {{ $priorityFilter === '' ? 'active' : '' }}">
                        Todas
                    </button>
                    @foreach ($priorities as $key => $label)
                        <button wire:click="$set('priorityFilter', '{{ $key }}')" @click="openMenu = null"
                                class="md-chip-menu__item {{ $priorityFilter === $key ? 'active' : '' }}">
                            {{ $label }}
                        </button>
                    @endforeach
                </div>
            </div>

            {{-- Size chip-menu --}}
            <div class="md-chip-menu md-chip-menu--end" :class="{ 'open': openMenu === 'size' }">
                <button @click="openMenu = openMenu === 'size' ? null : 'size'"
                        class="md-chip md-chip-filter {{ $sizeFilter ? 'selected' : '' }}">
                    {{ $sizeFilter ? $sizes[$sizeFilter] : 'Tamaño' }}
                    <i class="bi bi-chevron-down md-chip-menu__arrow"></i>
                </button>
                <div x-show="openMenu === 'size'"
                     x-transition:enter="transition ease-out duration-100"
                     x-transition:enter-start="opacity-0 scale-95"
                     x-transition:enter-end="opacity-100 scale-100"
                     x-transition:leave="transition ease-in duration-75"
                     x-transition:leave-start="opacity-100 scale-100"
                     x-transition:leave-end="opacity-0 scale-95"
                     class="md-chip-menu__dropdown" x-cloak>
                    <button wire:click="$set('sizeFilter', '')" @click="openMenu = null"
                            class="md-chip-menu__item {{ $sizeFilter === '' ? 'active' : '' }}">
                        Todos
                    </button>
                    @foreach ($sizes as $key => $label)
                        <button wire:click="$set('sizeFilter', '{{ $key }}')" @click="openMenu = null"
                                class="md-chip-menu__item {{ $sizeFilter === $key ? 'active' : '' }}">
                            {{ $label }}
                        </button>
                    @endforeach
                </div>
            </div>
        </div>
    </div>

    {{-- Task List --}}
    <div class="md-card-elevated" style="padding: 0; overflow: hidden;">
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
    </div>

    <div class="mt-3">
        {{ $tasks->links() }}
    </div>

    <x-slot:rail>
        <x-context-widget title="Hoy" icon="bi-lightning-charge" tone="success">
            <div class="text-center mb-2">
                <span style="font-size: 2rem; font-weight: 700; color: var(--md-sys-color-primary);">{{ $completedToday }}</span>
                <span class="md-body-small d-block" style="color: var(--md-sys-color-on-surface-variant);">completadas hoy</span>
            </div>
            <dl class="md-context-list">
                <div><dt>Planificadas hoy</dt><dd>{{ $plannedToday }}</dd></div>
                <div><dt>Pendientes</dt><dd>{{ $pendingCount }}</dd></div>
                @if ($overdueCount > 0)
                    <div style="color: var(--md-sys-color-error);"><dt>Vencidas</dt><dd>{{ $overdueCount }}</dd></div>
                @endif
            </dl>
        </x-context-widget>
        @if (!empty($categoryBreakdown))
            <x-context-widget title="Completadas hoy" icon="bi-bar-chart">
                <dl class="md-context-list">
                    @foreach ($categoryBreakdown as $cat => $count)
                        <div><dt>{{ $categories[$cat] ?? $cat }}</dt><dd>{{ $count }}</dd></div>
                    @endforeach
                </dl>
            </x-context-widget>
        @endif
        <x-context-widget title="Vistas relacionadas" icon="bi-signpost-split">
            <div class="md-context-links">
                <a href="{{ route('tasks.planning') }}"><i class="bi bi-calendar-week"></i> Planificación</a>
                <a href="{{ route('tasks.progress') }}"><i class="bi bi-trophy"></i> Progreso</a>
            </div>
        </x-context-widget>
    </x-slot:rail>

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
</x-module-shell>
