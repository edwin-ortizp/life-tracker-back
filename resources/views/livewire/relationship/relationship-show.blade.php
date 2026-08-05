<x-module-shell module="relationships" :title="$relationship->full_name"
                subtitle="Perfil, cronología y pendientes de esta relación."
                x-data="{
                    showEventDialog: $wire.entangle('showEventForm'),
                    showTaskDialog: $wire.entangle('showTaskForm'),
                }">
    <x-slot:actions>
        <x-module-actions
            :primary="['label' => 'Nuevo acontecimiento', 'icon' => 'bi-calendar-plus', 'action' => 'openEventForm']"
            :secondary="[
                ['label' => 'Nueva tarea', 'icon' => 'bi-check2-square', 'action' => 'openTaskForm'],
                ['label' => 'Marcar contacto', 'icon' => 'bi-chat-dots', 'action' => 'markContact'],
                ['label' => $relationship->is_archived ? 'Desarchivar' : 'Archivar', 'icon' => 'bi-archive', 'action' => 'toggleArchive'],
            ]" />
    </x-slot:actions>

    <div class="mb-3">
        <a href="{{ route('relationships') }}" class="md-btn-text" wire:navigate>
            <i class="bi bi-arrow-left"></i> Volver a Relaciones
        </a>
    </div>

    @if ($relationship->isFollowUpDue())
        <div class="md-card-outlined md-relationship-followup mb-3">
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                    <div class="md-title-small">Seguimiento vencido</div>
                    <p class="md-body-small mb-0" style="color: var(--md-sys-color-on-surface-variant);">
                        Último contacto hace {{ $relationship->daysSinceLastContact() }} días
                        (cada {{ $relationship->effectiveContactFrequencyDays() }} días).
                    </p>
                </div>
                <div class="d-flex gap-2">
                    <button wire:click="markContact" class="md-btn-outlined"><i class="bi bi-chat-dots"></i> Marcar contacto</button>
                    <button wire:click="suggestFollowUpTask" class="md-btn-filled"><i class="bi bi-plus-lg"></i> Crear tarea</button>
                </div>
            </div>
        </div>
    @endif

    {{-- Contact methods --}}
    <section class="md-card-outlined mb-3">
        <h2 class="md-title-medium mb-2">Medios de contacto</h2>
        @forelse ($relationship->contactMethods as $method)
            <div class="md-relationship-contact-row">
                <span class="md-chip-tonal md-chip-tonal--info">{{ $method->typeLabel() }}</span>
                <span class="md-body-medium">{{ $method->value }}</span>
                @if ($method->label)
                    <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">{{ $method->label }}</span>
                @endif
                @if ($method->is_primary)
                    <span class="md-chip-tonal md-chip-tonal--success">Principal</span>
                @endif
            </div>
        @empty
            <p class="md-body-small mb-0" style="color: var(--md-sys-color-on-surface-variant);">Sin medios de contacto registrados.</p>
        @endforelse
    </section>

    {{-- Timeline --}}
    <section class="md-card-outlined mb-3">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
            <h2 class="md-title-medium mb-0">Cronología</h2>
            <button wire:click="$toggle('showArchivedEvents')"
                    class="md-chip md-chip-filter {{ $showArchivedEvents ? 'selected' : '' }}">
                <i class="bi bi-archive"></i> Incluir archivados
            </button>
        </div>

        @if ($upcomingEvents->isNotEmpty())
            <h3 class="md-label-large md-relationship-timeline__heading">Próximos</h3>
            @foreach ($upcomingEvents as $event)
                @include('livewire.relationship.partials.event-row', ['event' => $event])
            @endforeach
        @endif

        @if ($pastEvents->isNotEmpty())
            <h3 class="md-label-large md-relationship-timeline__heading">Historial</h3>
            @foreach ($pastEvents as $event)
                @include('livewire.relationship.partials.event-row', ['event' => $event])
            @endforeach
        @endif

        @if ($upcomingEvents->isEmpty() && $pastEvents->isEmpty())
            <p class="md-body-small mb-0" style="color: var(--md-sys-color-on-surface-variant);">Sin acontecimientos registrados.</p>
        @endif
    </section>

    {{-- Linked emotional context: your own records, never events or tasks --}}
    <section class="md-card-outlined mb-3">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
            <h2 class="md-title-medium mb-0">Experiencias emocionales vinculadas</h2>
            <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">
                {{ $moodEntries->count() }} {{ $moodEntries->count() === 1 ? 'registro' : 'registros' }}
            </span>
        </div>
        <p class="md-body-small" style="color: var(--md-sys-color-on-surface-variant);">
            Son emociones que registraste y vinculaste con esta persona. Describen lo que anotaste, no lo que ella hizo.
        </p>

        @forelse ($moodEntries as $entry)
            <div class="md-relationship-emotion" wire:key="mood-link-{{ $entry->id }}">
                <span class="md-relationship-emotion__emoji">{{ $entry->emoji }}</span>
                <div class="md-relationship-emotion__body">
                    <div class="md-title-small">
                        {{ $entry->text }}
                        @if ($entry->intensity)
                            <span class="md-chip-tonal">Intensidad {{ $entry->intensity }}/5</span>
                        @endif
                    </div>
                    <div class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">
                        {{ $entry->date->format('d/m/Y') }} · {{ $entry->time }}
                    </div>
                    @if ($entry->situation)
                        <p class="md-body-small mt-1 mb-0">{{ $entry->situation }}</p>
                    @endif

                    @if ($entry->reflection && $entry->reflection->hasAnyAnswer())
                        <button type="button" wire:click="toggleReflection('{{ $entry->id }}')" class="md-btn-text mt-1"
                                aria-expanded="{{ in_array($entry->id, $expandedReflections, true) ? 'true' : 'false' }}">
                            <i class="bi {{ in_array($entry->id, $expandedReflections, true) ? 'bi-eye-slash' : 'bi-eye' }}"></i>
                            {{ in_array($entry->id, $expandedReflections, true) ? 'Ocultar reflexión' : 'Ver reflexión' }}
                        </button>

                        @if (in_array($entry->id, $expandedReflections, true))
                            <dl class="md-relationship-emotion__reflection">
                                @foreach ($entry->reflection->answeredSteps() as $answered)
                                    <dt>{{ $answered['label'] }}</dt>
                                    <dd class="md-body-small">{{ $answered['answer'] }}</dd>
                                @endforeach
                            </dl>
                        @endif
                    @endif
                </div>
                <button type="button" wire:click="unlinkMoodEntry('{{ $entry->id }}')"
                        wire:confirm="Se quitará el vínculo con esta persona. El registro emocional y su reflexión se conservan. ¿Continuar?"
                        class="md-btn-icon" title="Quitar vínculo">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        @empty
            <p class="md-body-small mb-0" style="color: var(--md-sys-color-on-surface-variant);">
                Sin experiencias emocionales vinculadas. Puedes vincular una desde “Añadir contexto” al registrar una emoción.
            </p>
        @endforelse
    </section>

    {{-- Descriptive patterns: counts and distributions, never a score --}}
    <section class="md-card-outlined mb-3">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
            <h2 class="md-title-medium mb-0">Patrones del periodo</h2>
            <div class="md-chip-rail">
                @foreach ($patternPeriods as $days => $label)
                    <button type="button" wire:click="setPatternDays({{ $days }})"
                            class="md-chip md-chip-filter {{ $patternDays === $days ? 'selected' : '' }}">{{ $label }}</button>
                @endforeach
            </div>
        </div>

        @php
            $sampleLabel = $patterns['sample_size'].' '.($patterns['sample_size'] === 1 ? 'registro' : 'registros').' en la muestra';
            $periodLabel = 'Del '.\Illuminate\Support\Carbon::parse($patterns['from'])->format('d/m/Y')
                .' al '.\Illuminate\Support\Carbon::parse($patterns['to'])->format('d/m/Y');
        @endphp
        <p class="md-body-small" style="color: var(--md-sys-color-on-surface-variant);">{{ $periodLabel }} · {{ $sampleLabel }}.</p>

        @if ($patterns['sample_size'] === 0)
            <p class="md-body-small mb-0" style="color: var(--md-sys-color-on-surface-variant);">
                No hay registros vinculados en este periodo.
            </p>
        @else
            <h3 class="md-label-large md-relationship-timeline__heading">Emociones registradas</h3>
            @foreach ($patterns['emotions'] as $emotion)
                @php
                    // Deliberately literal: it describes what was recorded, never what the person caused.
                    $emotionLabel = 'Registraste '.$emotion['text'].' en '.$emotion['count'].' '
                        .($emotion['count'] === 1 ? 'interacción vinculada' : 'interacciones vinculadas')
                        .' con '.$relationship->displayName();
                @endphp
                <div class="md-pattern-row">
                    <span class="md-body-small">{{ $emotion['emoji'] }} {{ $emotionLabel }}</span>
                    <div class="md-pattern-bar" role="presentation">
                        <div class="md-pattern-bar__fill" style="width: {{ $emotion['share'] }}%"></div>
                    </div>
                    <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">{{ $emotion['count'] }}</span>
                </div>
            @endforeach

            <h3 class="md-label-large md-relationship-timeline__heading">Intensidad</h3>
            @if ($patterns['intensity']['recorded'] === 0)
                <p class="md-body-small mb-0" style="color: var(--md-sys-color-on-surface-variant);">
                    No anotaste intensidad en estos registros.
                </p>
            @else
                <p class="md-body-small">
                    Anotaste intensidad en {{ $patterns['intensity']['recorded'] }} de {{ $patterns['sample_size'] }}
                    registros. Promedio anotado: {{ $patterns['intensity']['average'] }} de 5.
                </p>
                @foreach ($patterns['intensity']['distribution'] as $level => $count)
                    <div class="md-pattern-row">
                        <span class="md-label-small">Intensidad {{ $level }}</span>
                        <div class="md-pattern-bar" role="presentation">
                            <div class="md-pattern-bar__fill"
                                 style="width: {{ $patterns['intensity']['recorded'] ? ($count / $patterns['intensity']['recorded']) * 100 : 0 }}%"></div>
                        </div>
                        <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">{{ $count }}</span>
                    </div>
                @endforeach
            @endif

            <h3 class="md-label-large md-relationship-timeline__heading">Intensidad antes y después de reflexionar</h3>
            @if ($patterns['reflection_shift']['sample_size'] === 0)
                <p class="md-body-small mb-0" style="color: var(--md-sys-color-on-surface-variant);">
                    Todavía no hay reflexiones con intensidad anotada antes y después.
                </p>
            @else
                <p class="md-body-small mb-0">
                    Sobre {{ $patterns['reflection_shift']['sample_size'] }}
                    {{ $patterns['reflection_shift']['sample_size'] === 1 ? 'reflexión' : 'reflexiones' }}:
                    {{ $patterns['reflection_shift']['decreased'] }} con intensidad menor,
                    {{ $patterns['reflection_shift']['unchanged'] }} sin cambio y
                    {{ $patterns['reflection_shift']['increased'] }} con intensidad mayor.
                </p>
            @endif
        @endif
    </section>

    {{-- Tasks --}}
    <section class="md-card-outlined">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
            <h2 class="md-title-medium mb-0">Pendientes</h2>
            <a href="{{ route('tasks.list') }}" class="md-btn-text" wire:navigate><i class="bi bi-list-task"></i> Ir a Tareas</a>
        </div>

        @forelse ($pendingTasks as $task)
            <div class="md-relationship-task-row">
                <i class="bi bi-circle" aria-hidden="true"></i>
                <a href="{{ route('tasks.list', ['edit' => $task->id]) }}" class="md-body-medium" wire:navigate>{{ $task->title }}</a>
                @if ($task->end_date)
                    <span class="md-chip-tonal {{ $task->end_date->isPast() ? 'md-chip-tonal--warning' : '' }}">
                        Vence {{ $task->end_date->format('d/m/Y') }}
                    </span>
                @endif
                @if ($task->priority)
                    <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">{{ $priorities[$task->priority] ?? $task->priority }}</span>
                @endif
            </div>
        @empty
            <p class="md-body-small" style="color: var(--md-sys-color-on-surface-variant);">Sin tareas pendientes para esta relación.</p>
        @endforelse

        @if ($completedTasks->isNotEmpty())
            <h3 class="md-label-large md-relationship-timeline__heading">Completadas</h3>
            @foreach ($completedTasks as $task)
                <div class="md-relationship-task-row md-relationship-task-row--done">
                    <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
                    <a href="{{ route('tasks.list', ['edit' => $task->id]) }}" class="md-body-medium" wire:navigate>{{ $task->title }}</a>
                    @if ($task->completed_at)
                        <span class="md-label-small" style="color: var(--md-sys-color-on-surface-variant);">{{ $task->completed_at->format('d/m/Y') }}</span>
                    @endif
                </div>
            @endforeach
        @endif
    </section>

    <x-slot:rail>
        <x-context-widget title="Perfil" icon="bi-person-badge" tone="success">
            <dl class="md-context-list">
                <div><dt>Nombre</dt><dd>{{ $relationship->full_name }}</dd></div>
                @if ($relationship->nickname)
                    <div><dt>Apodo</dt><dd>{{ $relationship->nickname }}</dd></div>
                @endif
                @if ($relationship->pronouns)
                    <div><dt>Pronombres</dt><dd>{{ $relationship->pronouns }}</dd></div>
                @endif
                @if ($relationship->occupation)
                    <div><dt>Ocupación</dt><dd>{{ $relationship->occupation }}</dd></div>
                @endif
                @if ($relationship->organization)
                    <div><dt>Organización</dt><dd>{{ $relationship->organization }}</dd></div>
                @endif
                @if ($relationship->address)
                    <div><dt>Dirección</dt><dd>{{ $relationship->address }}</dd></div>
                @endif
                @if ($relationship->circle)
                    <div><dt>Círculo</dt><dd>{{ $relationship->circle->name }}</dd></div>
                @endif
                @if ($birthday)
                    <div>
                        <dt>Cumpleaños</dt>
                        <dd>{{ $birthday->label() }}{{ $birthday->ageOnNextOccurrence() !== null ? ' · cumple '.$birthday->ageOnNextOccurrence() : '' }}</dd>
                    </div>
                @endif
                <div>
                    <dt>Último contacto</dt>
                    <dd>{{ $relationship->last_contact_at?->format('d/m/Y') ?? 'Sin registro' }}</dd>
                </div>
            </dl>
        </x-context-widget>

        @if ($relationship->tags->isNotEmpty())
            <x-context-widget title="Etiquetas" icon="bi-tags">
                <div class="d-flex flex-wrap gap-1">
                    @foreach ($relationship->tags as $tag)
                        <span class="md-chip-tonal">{{ $tag->name }}</span>
                    @endforeach
                </div>
            </x-context-widget>
        @endif

        @if ($relationship->general_notes)
            <x-context-widget title="Notas" icon="bi-journal-text">
                <p class="md-body-small mb-0">{{ $relationship->general_notes }}</p>
            </x-context-widget>
        @endif

        <x-context-widget title="Enlaces" icon="bi-signpost-split">
            <div class="md-context-links">
                <a href="{{ route('relationships.events', ['relation' => $relationship->id]) }}" wire:navigate><i class="bi bi-calendar-event"></i> Acontecimientos</a>
                <a href="{{ route('relationships.birthdays') }}" wire:navigate><i class="bi bi-cake2"></i> Cumpleaños</a>
                <a href="{{ route('tasks.list') }}" wire:navigate><i class="bi bi-list-task"></i> Tareas</a>
            </div>
        </x-context-widget>
    </x-slot:rail>

    {{-- Event dialog --}}
    <template x-if="showEventDialog">
        <div>
            <div class="md-dialog-scrim" @click="showEventDialog = false"></div>
            <div class="md-dialog md-dialog--wide" @click.stop>
                <h2 class="md-dialog-headline md-headline-small">{{ $editingEventId ? 'Editar' : 'Nuevo' }} acontecimiento</h2>
                <div class="md-dialog-content">
                    <div class="d-flex flex-column gap-3">
                        <div class="md-text-field">
                            <input type="text" wire:model="eventTitle" placeholder=" " id="event-title">
                            <label for="event-title">Título</label>
                        </div>
                        @error('eventTitle') <p class="md-body-small" style="color: var(--md-sys-color-error);">{{ $message }}</p> @enderror

                        <div class="row g-3">
                            <div class="col-6">
                                <div class="md-text-field">
                                    <select wire:model="eventCategory" id="event-category">
                                        @foreach (\App\Models\RelationshipEvent::CATEGORIES as $key => $label)
                                            <option value="{{ $key }}">{{ $label }}</option>
                                        @endforeach
                                    </select>
                                    <label for="event-category">Categoría</label>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="md-text-field">
                                    <select wire:model.live="eventPrecision" id="event-precision">
                                        @foreach (\App\Support\EventDate::PRECISIONS as $key => $label)
                                            <option value="{{ $key }}">{{ $label }}</option>
                                        @endforeach
                                    </select>
                                    <label for="event-precision">Precisión de la fecha</label>
                                </div>
                            </div>
                        </div>

                        @if ($eventPrecision === \App\Support\EventDate::DAY)
                            <div class="md-text-field">
                                <input type="date" wire:model="eventDate" placeholder=" " id="event-date">
                                <label for="event-date">Fecha</label>
                            </div>
                        @elseif ($eventPrecision === \App\Support\EventDate::MONTH)
                            <div class="row g-3">
                                <div class="col-6">
                                    <div class="md-text-field">
                                        <select wire:model="eventMonth" id="event-month">
                                            @foreach (['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'] as $index => $monthName)
                                                <option value="{{ $index + 1 }}">{{ ucfirst($monthName) }}</option>
                                            @endforeach
                                        </select>
                                        <label for="event-month">Mes</label>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="md-text-field">
                                        <input type="number" wire:model="eventYear" placeholder=" " id="event-month-year">
                                        <label for="event-month-year">Año</label>
                                    </div>
                                </div>
                            </div>
                        @elseif ($eventPrecision === \App\Support\EventDate::YEAR)
                            <div class="md-text-field">
                                <input type="number" wire:model="eventYear" placeholder=" " id="event-year">
                                <label for="event-year">Año</label>
                            </div>
                        @else
                            <div class="row g-3">
                                <div class="col-6">
                                    <div class="md-text-field">
                                        <input type="date" wire:model="eventStartsOn" placeholder=" " id="event-starts-on">
                                        <label for="event-starts-on">Desde</label>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="md-text-field">
                                        <input type="date" wire:model="eventEndsOn" placeholder=" " id="event-ends-on">
                                        <label for="event-ends-on">Hasta</label>
                                    </div>
                                </div>
                            </div>
                        @endif
                        @error('eventPrecision') <p class="md-body-small" style="color: var(--md-sys-color-error);">{{ $message }}</p> @enderror

                        <div class="md-text-field">
                            <textarea wire:model="eventNotes" placeholder=" " id="event-notes" rows="3"></textarea>
                            <label for="event-notes">Notas</label>
                        </div>

                        <label class="md-relationship-sensitive">
                            <input type="checkbox" wire:model="eventIsSensitive" id="event-sensitive">
                            <span class="md-body-small">Marcar como sensible (no aparecerá en vistas globales ni resúmenes)</span>
                        </label>
                    </div>
                </div>
                <div class="md-dialog-actions">
                    <button @click="showEventDialog = false" class="md-btn-text">Cancelar</button>
                    <button wire:click="saveEvent" class="md-btn-filled">
                        <i class="bi bi-check-lg"></i> {{ $editingEventId ? 'Actualizar' : 'Guardar' }}
                    </button>
                </div>
            </div>
        </div>
    </template>

    {{-- Task dialog --}}
    <template x-if="showTaskDialog">
        <div>
            <div class="md-dialog-scrim" @click="showTaskDialog = false"></div>
            <div class="md-dialog" @click.stop>
                <h2 class="md-dialog-headline md-headline-small">Nueva tarea asociada</h2>
                <div class="md-dialog-content">
                    <div class="d-flex flex-column gap-3">
                        <div class="md-text-field">
                            <input type="text" wire:model="taskTitle" placeholder=" " id="task-title">
                            <label for="task-title">Título</label>
                        </div>
                        @error('taskTitle') <p class="md-body-small" style="color: var(--md-sys-color-error);">{{ $message }}</p> @enderror

                        <div class="md-text-field">
                            <textarea wire:model="taskDescription" placeholder=" " id="task-description" rows="3"></textarea>
                            <label for="task-description">Descripción</label>
                        </div>

                        <div class="row g-3">
                            <div class="col-6">
                                <div class="md-text-field">
                                    <select wire:model="taskPriority" id="task-priority">
                                        <option value="">Sin prioridad</option>
                                        @foreach ($priorities as $key => $label)
                                            <option value="{{ $key }}">{{ $label }}</option>
                                        @endforeach
                                    </select>
                                    <label for="task-priority">Prioridad</label>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="md-text-field">
                                    <input type="date" wire:model="taskDueDate" placeholder=" " id="task-due-date">
                                    <label for="task-due-date">Vencimiento</label>
                                </div>
                            </div>
                        </div>

                        <label class="md-relationship-sensitive">
                            <input type="checkbox" wire:model="taskIsPrivate" id="task-private">
                            <span class="md-body-small">Tarea privada</span>
                        </label>
                    </div>
                </div>
                <div class="md-dialog-actions">
                    <button @click="showTaskDialog = false" class="md-btn-text">Cancelar</button>
                    <button wire:click="saveTask" class="md-btn-filled"><i class="bi bi-check-lg"></i> Crear tarea</button>
                </div>
            </div>
        </div>
    </template>
</x-module-shell>
