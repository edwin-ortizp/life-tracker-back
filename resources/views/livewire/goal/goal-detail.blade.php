<x-module-shell module="goals">
    <x-slot:actions>
        <x-module-actions :primary="['label' => 'Nueva tarea', 'icon' => 'bi-plus-lg', 'action' => 'openTaskForm']" :secondary="[
            ['label' => 'Registrar avance', 'icon' => 'bi-journal-plus', 'action' => 'openEntryForm'],
            ['label' => 'Editar objetivo', 'icon' => 'bi-pencil', 'action' => 'openGoalForm'],
            ['label' => 'Volver a objetivos', 'icon' => 'bi-arrow-left', 'href' => route('goals')],
        ]" />
    </x-slot:actions>

    <div class="goal-detail">
        <section class="goal-hero md-card-outlined">
            <div>
                <div class="d-flex align-items-center gap-2 mb-2">
                    <span class="md-chip-tonal {{ $goal->status === 'completed' ? 'goal-status--completed' : ($goal->status === 'abandoned' ? 'goal-status--abandoned' : '') }}">
                        <i class="bi {{ $goal->status === 'completed' ? 'bi-check-circle-fill' : ($goal->status === 'abandoned' ? 'bi-x-circle-fill' : 'bi-flag-fill') }}"></i>
                        {{ $goal->status === 'completed' ? 'Completado' : ($goal->status === 'abandoned' ? 'Abandonado' : 'Activo') }}
                    </span>
                    @if ($goal->start_date && $goal->due_date)
                        <span class="goal-hero__date">{{ $goal->start_date->format('d M') }} — {{ $goal->due_date->format('d M Y') }}</span>
                    @endif
                </div>
                <h2>{{ $goal->title }}</h2>
                @if ($goal->description)<p>{{ $goal->description }}</p>@endif
            </div>
            <div class="goal-hero__state" aria-label="Cambiar estado">
                @foreach (['active' => 'Activo', 'completed' => 'Completar', 'abandoned' => 'Abandonar'] as $value => $label)
                    @if ($goal->status !== $value)
                        <button wire:click="updateStatus('{{ $value }}')" class="md-btn-text">{{ $label }}</button>
                    @endif
                @endforeach
            </div>
        </section>

        <div class="goal-detail__grid">
            <main class="goal-detail__main">
                @if ($kpi && $progress)
                    @php($expectedPercent = $progress['expectedPercent'] ?? 0)
                    <section class="goal-kpi-card md-card-outlined">
                        <div class="goal-section-heading">
                            <div><span class="goal-section-heading__eyebrow">KPI principal</span><h2>{{ $kpi['name'] }}</h2></div>
                            <button wire:click="openNumericForm" class="md-btn-outlined"><i class="bi bi-plus-lg"></i> Registrar medición</button>
                        </div>

                        <div class="goal-kpi-values">
                            <div><span>Avance real</span><strong>{{ number_format($progress['currentValue'], 2, ',', '.') }} <small>{{ $kpi['unit'] }}</small></strong><em>{{ number_format($progress['actualPercent'], 0) }}%</em></div>
                            <div><span>Esperado hoy</span><strong>{{ $progress['expectedValue'] === null ? '—' : number_format($progress['expectedValue'], 2, ',', '.') }} @if($progress['expectedValue'] !== null)<small>{{ $kpi['unit'] }}</small>@endif</strong><em>{{ $progress['expectedPercent'] === null ? 'Sin calendario' : number_format($progress['expectedPercent'], 0).'%' }}</em></div>
                            <div><span>Meta final</span><strong>{{ number_format($progress['targetValue'], 2, ',', '.') }} <small>{{ $kpi['unit'] }}</small></strong><em>{{ $kpi['direction'] === 'decrease' ? 'Reducir' : 'Aumentar' }}</em></div>
                        </div>
                        <div class="goal-progress-track" aria-label="{{ number_format($progress['actualPercent'], 0) }}% de avance real y {{ number_format($expectedPercent, 0) }}% esperado">
                            <i class="goal-progress-track__expected" style="width: {{ $expectedPercent }}%"></i>
                            <b style="width: {{ $progress['actualPercent'] }}%"></b>
                        </div>
                        <div class="goal-progress-legend"><span><i class="goal-progress-legend__actual"></i> Avance real</span><span><i class="goal-progress-legend__expected"></i> Ritmo esperado</span><strong class="{{ $progress['onSchedule'] === null ? '' : ($progress['onSchedule'] ? 'is-on-track' : 'is-behind') }}">{{ $progress['onSchedule'] === null ? 'Añade fechas para calcular el ritmo' : ($progress['onSchedule'] ? 'Vas al ritmo esperado' : 'Requiere atención') }}</strong></div>

                        <div class="goal-history">
                            <div class="goal-history__header"><h3>Historial de mediciones</h3><span>{{ $goal->goalNumericEntries->count() }} registros</span></div>
                            @forelse ($goal->goalNumericEntries as $entry)
                                <div class="goal-history__row" wire:key="numeric-{{ $entry->id }}">
                                    <div><strong>{{ number_format($entry->value, 2, ',', '.') }} {{ $kpi['unit'] }}</strong><span>{{ $entry->note ?: 'Sin nota' }}</span></div>
                                    <time>{{ $entry->date->format('d M Y') }}</time>
                                    <div class="goal-history__actions"><button wire:click="openNumericForm('{{ $entry->id }}')" class="md-btn-icon" aria-label="Editar medición"><i class="bi bi-pencil"></i></button><button wire:click="deleteNumericEntry('{{ $entry->id }}')" wire:confirm="¿Eliminar esta medición?" class="md-btn-icon" aria-label="Eliminar medición"><i class="bi bi-trash"></i></button></div>
                                </div>
                            @empty
                                <p class="goal-history__empty">Aún no hay mediciones. Registra la primera para actualizar el avance real.</p>
                            @endforelse
                        </div>
                    </section>
                @else
                    <section class="goal-kpi-empty md-card-outlined">
                        <i class="bi bi-graph-up-arrow"></i><div><h2>Este objetivo aún no tiene KPI</h2><p>Define el indicador, el valor inicial y la meta para comparar tu avance con el ritmo esperado.</p></div><button wire:click="openGoalForm" class="md-btn-filled">Configurar KPI</button>
                    </section>
                @endif

                <section class="md-card-outlined goal-section-card">
                    <div class="goal-section-heading"><div><span class="goal-section-heading__eyebrow">Bitácora</span><h2>Avances e hitos</h2></div><button wire:click="openEntryForm" class="md-btn-outlined"><i class="bi bi-plus-lg"></i> Registrar avance</button></div>
                    <div class="goal-timeline">
                        @forelse ($goal->goalEntries as $entry)
                            <article class="goal-timeline__item {{ $entry->is_milestone ? 'is-milestone' : '' }}" wire:key="entry-{{ $entry->id }}">
                                <div class="goal-timeline__mark"><i class="bi {{ $entry->is_milestone ? 'bi-star-fill' : 'bi-dot' }}"></i></div><div class="goal-timeline__content"><time>{{ $entry->date->translatedFormat('d \d\e F, Y') }}</time><p>{{ $entry->text }}</p></div><div class="goal-history__actions"><button wire:click="openEntryForm('{{ $entry->id }}')" class="md-btn-icon" aria-label="Editar avance"><i class="bi bi-pencil"></i></button><button wire:click="deleteEntry('{{ $entry->id }}')" wire:confirm="¿Eliminar este avance?" class="md-btn-icon" aria-label="Eliminar avance"><i class="bi bi-trash"></i></button></div>
                            </article>
                        @empty
                            <p class="goal-history__empty">Registra avances o hitos para dejar una historia útil del objetivo.</p>
                        @endforelse
                    </div>
                </section>

                <section class="md-card-outlined goal-section-card">
                    <div class="goal-section-heading"><div><span class="goal-section-heading__eyebrow">Ejecución</span><h2>Tareas relacionadas</h2></div><button wire:click="openTaskForm" class="md-btn-outlined"><i class="bi bi-plus-lg"></i> Nueva tarea</button></div>
                    <div class="goal-task-list">
                        @forelse ($goal->tasks as $task)
                            <a href="{{ route('tasks.list', ['edit' => $task->id]) }}" class="goal-task-row" wire:navigate wire:key="task-{{ $task->id }}"><i class="bi {{ $task->completed ? 'bi-check-circle-fill' : 'bi-circle' }}"></i><span>{{ $task->title }}</span>@if ($task->end_date)<time>{{ $task->end_date->format('d M') }}</time>@endif<i class="bi bi-arrow-up-right"></i></a>
                        @empty
                            <p class="goal-history__empty">Aún no hay tareas vinculadas. Crea la primera acción concreta para este objetivo.</p>
                        @endforelse
                    </div>
                </section>
            </main>

            <aside class="goal-detail__rail">
                <section class="md-context-widget"><div class="md-context-widget__header"><span class="md-context-widget__icon"><i class="bi bi-clipboard-data"></i></span><h2>Panorama</h2></div><div class="md-context-widget__content"><dl class="md-context-list"><div><dt>Tareas</dt><dd>{{ $goal->tasks->where('completed', true)->count() }}/{{ $goal->tasks->count() }}</dd></div><div><dt>Avances</dt><dd>{{ $goal->goalEntries->count() }}</dd></div><div><dt>Hitos</dt><dd>{{ $goal->goalEntries->where('is_milestone', true)->count() }}</dd></div>@if($goal->due_date)<div><dt>Fecha límite</dt><dd>{{ $goal->due_date->format('d M Y') }}</dd></div>@endif</dl></div></section>
                <section class="md-context-widget goal-motivation"><div class="md-context-widget__header"><span class="md-context-widget__icon"><i class="bi bi-lightning-charge"></i></span><h2>Motivación</h2></div><div class="md-context-widget__content"><p>Marca cómo te está haciendo sentir este objetivo.</p><div><button wire:click="incrementMotivation('positive')" class="md-btn-outlined"><i class="bi bi-hand-thumbs-up"></i> {{ $goal->positive_count }}</button><button wire:click="incrementMotivation('negative')" class="md-btn-outlined"><i class="bi bi-hand-thumbs-down"></i> {{ $goal->negative_count }}</button></div></div></section>
            </aside>
        </div>
    </div>

    @if ($showGoalForm)
        <div class="md-dialog-scrim" wire:click="$set('showGoalForm', false)"></div><div class="md-dialog goal-dialog-wide"><h2 class="md-dialog-headline">Editar objetivo</h2><form wire:submit="saveGoal"><div class="md-dialog-content goal-form-grid"><div class="md-text-field goal-form-grid__full"><input wire:model="title" id="goal-title" placeholder=" "><label for="goal-title">Título</label>@error('title')<small>{{ $message }}</small>@enderror</div><div class="md-text-field goal-form-grid__full"><textarea wire:model="description" id="goal-description" placeholder=" " rows="3"></textarea><label for="goal-description">Descripción</label></div><div class="md-text-field"><select wire:model="status" id="goal-status"><option value="active">Activo</option><option value="completed">Completado</option><option value="abandoned">Abandonado</option></select><label for="goal-status">Estado</label></div><div class="md-text-field"><input wire:model="startDate" id="goal-start" type="date" placeholder=" "><label for="goal-start">Fecha inicio</label>@error('startDate')<small>{{ $message }}</small>@enderror</div><div class="md-text-field"><input wire:model="dueDate" id="goal-due" type="date" placeholder=" "><label for="goal-due">Fecha límite</label>@error('dueDate')<small>{{ $message }}</small>@enderror</div><label class="goal-kpi-toggle goal-form-grid__full"><input wire:model.live="kpiEnabled" type="checkbox"><span><i class="bi bi-graph-up-arrow"></i> Activar KPI único</span></label>@if($kpiEnabled)<div class="goal-kpi-form goal-form-grid__full"><div class="md-text-field"><input wire:model="kpiName" id="kpi-name" placeholder=" "><label for="kpi-name">Nombre del KPI</label>@error('kpiName')<small>{{ $message }}</small>@enderror</div><div class="md-text-field"><input wire:model="kpiUnit" id="kpi-unit" placeholder=" "><label for="kpi-unit">Unidad</label>@error('kpiUnit')<small>{{ $message }}</small>@enderror</div><div class="md-text-field"><select wire:model="kpiDirection" id="kpi-direction"><option value="increase">Aumentar hasta la meta</option><option value="decrease">Reducir hasta la meta</option></select><label for="kpi-direction">Dirección</label></div><div class="md-text-field"><input wire:model="kpiStartValue" id="kpi-start" type="number" step="0.01" placeholder=" "><label for="kpi-start">Valor inicial</label>@error('kpiStartValue')<small>{{ $message }}</small>@enderror</div><div class="md-text-field"><input wire:model="kpiTargetValue" id="kpi-target" type="number" step="0.01" placeholder=" "><label for="kpi-target">Valor objetivo</label>@error('kpiTargetValue')<small>{{ $message }}</small>@enderror</div></div>@endif</div><div class="md-dialog-actions"><button type="button" wire:click="$set('showGoalForm', false)" class="md-btn-text">Cancelar</button><button class="md-btn-filled" type="submit">Guardar cambios</button></div></form></div>
    @endif

    @if ($showEntryForm)
        <div class="md-dialog-scrim" wire:click="$set('showEntryForm', false)"></div><div class="md-dialog"><h2 class="md-dialog-headline">{{ $editingEntryId ? 'Editar avance' : 'Registrar avance' }}</h2><form wire:submit="saveEntry"><div class="md-dialog-content d-flex flex-column gap-3"><div class="md-text-field"><textarea wire:model="entryText" id="entry-text" rows="4" placeholder=" "></textarea><label for="entry-text">¿Qué avanzaste?</label>@error('entryText')<small>{{ $message }}</small>@enderror</div><div class="md-text-field"><input wire:model="entryDate" id="entry-date" type="date" placeholder=" "><label for="entry-date">Fecha</label></div><label class="goal-kpi-toggle"><input wire:model="entryIsMilestone" type="checkbox"><span><i class="bi bi-star"></i> Marcar como hito</span></label></div><div class="md-dialog-actions"><button type="button" wire:click="$set('showEntryForm', false)" class="md-btn-text">Cancelar</button><button type="submit" class="md-btn-filled">Guardar</button></div></form></div>
    @endif

    @if ($showNumericForm)
        <div class="md-dialog-scrim" wire:click="$set('showNumericForm', false)"></div><div class="md-dialog"><h2 class="md-dialog-headline">{{ $editingNumericId ? 'Editar medición' : 'Registrar medición' }}</h2><form wire:submit="saveNumericEntry"><div class="md-dialog-content d-flex flex-column gap-3"><div class="md-text-field"><input wire:model="numericValue" id="numeric-value" type="number" step="0.01" placeholder=" "><label for="numeric-value">Valor {{ $kpi['unit'] ?? '' }}</label>@error('numericValue')<small>{{ $message }}</small>@enderror</div><div class="md-text-field"><input wire:model="numericDate" id="numeric-date" type="date" placeholder=" "><label for="numeric-date">Fecha</label></div><div class="md-text-field"><textarea wire:model="numericNote" id="numeric-note" rows="2" placeholder=" "></textarea><label for="numeric-note">Nota opcional</label></div></div><div class="md-dialog-actions"><button type="button" wire:click="$set('showNumericForm', false)" class="md-btn-text">Cancelar</button><button type="submit" class="md-btn-filled">Guardar</button></div></form></div>
    @endif

    @if ($showTaskForm)
        <div class="md-dialog-scrim" wire:click="$set('showTaskForm', false)"></div><div class="md-dialog goal-dialog-wide"><h2 class="md-dialog-headline">Nueva tarea relacionada</h2><form wire:submit="saveTask"><div class="md-dialog-content goal-form-grid"><div class="md-text-field goal-form-grid__full"><input wire:model="taskTitle" id="task-title" placeholder=" "><label for="task-title">Título</label>@error('taskTitle')<small>{{ $message }}</small>@enderror</div><div class="md-text-field goal-form-grid__full"><textarea wire:model="taskDescription" id="task-description" rows="3" placeholder=" "></textarea><label for="task-description">Descripción</label></div><div class="md-text-field"><select wire:model="taskCategory" id="task-category"><option value="">Sin categoría</option>@foreach($categories as $value => $label)<option value="{{ $value }}">{{ $label }}</option>@endforeach</select><label for="task-category">Categoría</label></div><div class="md-text-field"><select wire:model="taskPriority" id="task-priority"><option value="">Sin prioridad</option>@foreach($priorities as $value => $label)<option value="{{ $value }}">{{ $label }}</option>@endforeach</select><label for="task-priority">Prioridad</label></div><div class="md-text-field"><select wire:model="taskSize" id="task-size"><option value="">Sin tamaño</option>@foreach($sizes as $value => $label)<option value="{{ $value }}">{{ $label }}</option>@endforeach</select><label for="task-size">Tamaño</label></div><div class="md-text-field"><input wire:model="taskDueDate" id="task-due" type="date" placeholder=" "><label for="task-due">Fecha límite</label></div></div><div class="md-dialog-actions"><button type="button" wire:click="$set('showTaskForm', false)" class="md-btn-text">Cancelar</button><button type="submit" class="md-btn-filled">Crear y vincular</button></div></form></div>
    @endif
</x-module-shell>
