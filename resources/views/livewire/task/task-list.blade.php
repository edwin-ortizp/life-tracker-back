<x-module-shell module="tasks" x-data="{ showDialog: $wire.entangle('showForm'), showBulkDialog: $wire.entangle('showBulkForm'), showRecurringDialog: $wire.entangle('showRecurringCompletion') }">
    <x-slot:actions>
        <x-module-actions
            :primary="['label' => 'Nueva tarea', 'icon' => 'bi-plus-lg', 'action' => 'openForm']"
            :secondary="[['label' => 'Varias tareas', 'icon' => 'bi-list-stars', 'action' => 'openBulkForm']]" />
    </x-slot:actions>

    {{-- Filters as M3 chips --}}
    <div class="md-card-filled mb-3">
        <div class="d-flex flex-wrap gap-2 align-items-center">
            <div class="md-chip-group">
                <button wire:click="$set('filter', 'pending')"
                        class="md-chip md-chip-filter {{ $filter === 'pending' ? 'selected' : '' }}">
                    <i class="bi bi-clock"></i> Pendientes
                </button>
                <button wire:click="$set('filter', 'completed')"
                        class="md-chip md-chip-filter {{ $filter === 'completed' ? 'selected' : '' }}">
                    <i class="bi bi-check-lg"></i> Completadas
                </button>
                <button wire:click="$set('filter', 'all')"
                        class="md-chip md-chip-filter {{ $filter === 'all' ? 'selected' : '' }}">
                    Todas
                </button>
            </div>

            <div class="d-flex gap-2 ms-auto">
                <div class="md-text-field" style="width: auto; min-width: 140px;">
                    <select wire:model.live="categoryFilter">
                        <option value="">Todas</option>
                        @foreach ($categories as $key => $label)
                            <option value="{{ $key }}">{{ $label }}</option>
                        @endforeach
                    </select>
                    <label>Categoría</label>
                </div>
                <div class="md-text-field" style="width: auto; min-width: 140px;">
                    <select wire:model.live="priorityFilter">
                        <option value="">Todas</option>
                        @foreach ($priorities as $key => $label)
                            <option value="{{ $key }}">{{ $label }}</option>
                        @endforeach
                    </select>
                    <label>Prioridad</label>
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
                        @if ($task->end_date)
                            <span class="md-chip-tonal">
                                <i class="bi bi-calendar" style="font-size: 0.625rem;"></i> {{ $task->end_date->format('d M') }}
                            </span>
                        @endif
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

    <x-slot:rail>
        <x-context-widget title="Estado de las tareas" icon="bi-list-check">
            <dl class="md-context-list">
                <div><dt>Pendientes</dt><dd>{{ $pendingCount }}</dd></div>
                <div><dt>Completadas</dt><dd>{{ $completedCount }}</dd></div>
                <div><dt>Total</dt><dd>{{ $pendingCount + $completedCount }}</dd></div>
            </dl>
        </x-context-widget>
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
                        <div class="row g-3">
                            <div class="col-6"><div class="md-text-field"><input type="date" wire:model="bulkStartDate" placeholder=" " id="bulk-task-start"><label for="bulk-task-start">Fecha inicio</label></div></div>
                            <div class="col-6"><div class="md-text-field"><input type="date" wire:model="bulkEndDate" placeholder=" " id="bulk-task-end"><label for="bulk-task-end">Fecha fin</label></div></div>
                        </div>
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
