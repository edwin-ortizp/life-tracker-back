<x-module-shell module="health" class="health-page">
    <x-slot:actions>
        <x-module-actions
            :primary="['label' => 'Registrar evento', 'icon' => 'bi-plus-lg', 'action' => 'openForm']"
            :secondary="[['label' => 'Nuevo pendiente', 'icon' => 'bi-check2-square', 'action' => 'openTaskForm']]" />
    </x-slot:actions>

    <section class="md-card-outlined mb-4 p-3">
        <div class="row g-3 align-items-end">
            <div class="col-md-7">
                <div class="health-filter-label">Tipo de registro</div>
                <div class="d-flex flex-wrap gap-2">
                    <button wire:click="$set('typeFilter', '')" class="md-chip-filter {{ $typeFilter === '' ? 'selected' : '' }}">Todos</button>
                    @foreach($types as $key => $label)
                        <button wire:click="$set('typeFilter', '{{ $key }}')" class="md-chip-filter {{ $typeFilter === $key ? 'selected' : '' }}">{{ $label }}</button>
                    @endforeach
                </div>
            </div>
            <div class="col-md-5">
                <div class="health-filter-label">Momento</div>
                <div class="d-flex gap-2">
                    @foreach(['all' => 'Todo', 'upcoming' => 'Próximos', 'history' => 'Historial'] as $value => $label)
                        <button wire:click="$set('period', '{{ $value }}')" class="md-chip-filter {{ $period === $value ? 'selected' : '' }}">{{ $label }}</button>
                    @endforeach
                </div>
            </div>
        </div>
    </section>

    <section class="health-timeline" aria-label="Cronología de salud">
        @forelse($events as $event)
            @php($task = $event->tasks->sortBy('created_at')->first())
            <article class="health-event {{ $event->event_date->isFuture() ? 'is-upcoming' : '' }}">
                <div class="health-event-date">
                    <strong>{{ $event->event_date->translatedFormat('d') }}</strong>
                    <span>{{ strtoupper($event->event_date->translatedFormat('M')) }}</span>
                    <small>{{ $event->event_date->format('Y') }}</small>
                </div>
                <div class="health-event-marker"><i class="bi {{ match($event->type) { 'appointment' => 'bi-hospital', 'checkup' => 'bi-clipboard2-pulse', 'procedure' => 'bi-bandaid', 'symptom' => 'bi-activity', 'illness' => 'bi-thermometer-half', 'vaccination' => 'bi-shield-plus' } }}"></i></div>
                <div class="health-event-card md-card-elevated">
                    <div class="d-flex gap-3 justify-content-between align-items-start">
                        <div>
                            <span class="health-type-chip">{{ $types[$event->type] }}</span>
                            <h2 class="md-title-large mt-2 mb-1">{{ $event->title }}</h2>
                            @if($event->end_date)<p class="health-date-range mb-0">Hasta {{ $event->end_date->translatedFormat('d \d\e F \d\e Y') }}</p>@endif
                        </div>
                        <div class="d-flex gap-1">
                            <button wire:click="openForm('{{ $event->id }}')" class="md-btn-icon" title="Editar"><i class="bi bi-pencil"></i></button>
                            <button wire:click="deleteEvent('{{ $event->id }}')" wire:confirm="¿Eliminar este evento? La tarea asociada se conservará." class="md-btn-icon" title="Eliminar"><i class="bi bi-trash"></i></button>
                        </div>
                    </div>

                    @if($event->details)
                        <div class="health-details mt-3">
                            @if(isset($event->details['body_area']))<span><i class="bi bi-person-arms-up"></i> {{ \App\Models\HealthEvent::bodyAreaLabel($event->details['body_area'], $event->details['body_area_note'] ?? null) }}</span>@endif
                            @if(isset($event->details['severity']))<span><i class="bi bi-bar-chart-fill"></i> Intensidad {{ $event->details['severity'] }}/5</span>@endif
                            @if(isset($event->details['condition']))<span><i class="bi bi-capsule"></i> {{ \App\Models\HealthEvent::illnessLabel($event->details['condition'], $event->details['condition_note'] ?? null) }}</span>@endif
                            @if(isset($event->details['provider']))<span><i class="bi bi-person-badge"></i> {{ $event->details['provider'] }}</span>@endif
                            @if(isset($event->details['specialty']))<span><i class="bi bi-heart-pulse"></i> {{ $event->details['specialty'] }}</span>@endif
                            @if(isset($event->details['vaccine_name']))<span><i class="bi bi-shield-check"></i> {{ $event->details['vaccine_name'] }}{{ isset($event->details['dose']) ? ' · '.$event->details['dose'] : '' }}</span>@endif
                        </div>
                    @endif
                    @if($event->notes)<p class="health-notes mb-0 mt-3">{{ $event->notes }}</p>@endif
                    @if($task)
                        <a href="{{ route('tasks.planning') }}" class="health-task-link mt-3">
                            <i class="bi {{ $task->completed ? 'bi-check-circle-fill' : 'bi-calendar-check' }}"></i>
                            <span>{{ $task->completed ? 'Acción completada' : 'Ver en Planificación' }}</span><i class="bi bi-arrow-right"></i>
                        </a>
                    @elseif($event->event_date->isFuture())
                        <p class="health-no-task mt-3 mb-0"><i class="bi bi-info-circle"></i> Este registro no requiere una acción de agenda.</p>
                    @endif
                </div>
            </article>
        @empty
            <div class="health-empty md-card-outlined">
                <i class="bi bi-heart-pulse"></i><h2 class="md-title-large">Aún no hay registros</h2><p>Registra una cita, un síntoma, una vacuna o un próximo control.</p>
                <button wire:click="openForm" class="md-btn-tonal">Crear primer registro</button>
            </div>
        @endforelse
    </section>

    <x-slot:rail>
        <x-context-widget title="Próximo cuidado" icon="bi-calendar-heart">
            @if ($nextEvent)
                <div class="health-next-event">
                    <time datetime="{{ $nextEvent->event_date->toDateString() }}">{{ $nextEvent->event_date->translatedFormat('D d M') }}</time>
                    <strong>{{ $nextEvent->title }}</strong>
                    <span>{{ $types[$nextEvent->type] }}</span>
                </div>
            @else
                <p class="mb-0">No hay eventos futuros registrados.</p>
            @endif
        </x-context-widget>
        <x-context-widget title="Seguimiento" icon="bi-clipboard2-pulse" tone="success">
            <dl class="md-context-list">
                <div><dt>Próximos eventos</dt><dd>{{ $upcomingCount }}</dd></div>
                <div><dt>Pendientes de salud</dt><dd>{{ $pendingHealthTasks }}</dd></div>
            </dl>
            <div class="md-context-links mt-2">
                <a href="{{ route('health.body', ['period' => $period, 'type' => $typeFilter]) }}"><i class="bi bi-person-standing"></i> Abrir vista corporal</a>
                <a href="{{ route('tasks.planning', ['category' => 'salud']) }}"><i class="bi bi-calendar-check"></i> Ver planificación</a>
            </div>
        </x-context-widget>
    </x-slot:rail>

    @if($showForm)
        <div class="md-dialog-backdrop" wire:click="closeForm"></div>
        <section class="md-dialog health-dialog" role="dialog" aria-modal="true" aria-labelledby="health-dialog-title">
            <div class="md-dialog-header"><h2 id="health-dialog-title">{{ $editingId ? 'Editar registro' : 'Nuevo registro de salud' }}</h2><button wire:click="closeForm" class="md-btn-icon"><i class="bi bi-x-lg"></i></button></div>
            <form wire:submit="save">
                <div class="md-dialog-body">
                    <div class="row g-3">
                        <div class="col-md-6"><div class="md-text-field"><select wire:model.live="type" id="health-type">@foreach($types as $key => $label)<option value="{{ $key }}">{{ $label }}</option>@endforeach</select><label for="health-type">Tipo</label></div>@error('type')<small class="text-danger">{{ $message }}</small>@enderror</div>
                        <div class="col-md-6"><div class="md-text-field"><input wire:model="title" id="health-title" type="text"><label for="health-title">Título</label></div>@error('title')<small class="text-danger">{{ $message }}</small>@enderror</div>
                        <div class="col-md-6"><div class="md-text-field"><input wire:model="eventDate" id="health-date" type="date"><label for="health-date">Fecha</label></div>@error('eventDate')<small class="text-danger">{{ $message }}</small>@enderror</div>
                        <div class="col-md-6"><div class="md-text-field"><input wire:model="endDate" id="health-end-date" type="date"><label for="health-end-date">Hasta (opcional)</label></div>@error('endDate')<small class="text-danger">{{ $message }}</small>@enderror</div>
                        @if($type === 'symptom')
                            <div class="col-md-7"><div class="md-text-field"><select wire:model.live="bodyArea" id="health-body-area"><option value="">Selecciona una zona</option>@foreach($bodyAreas as $key => $label)<option value="{{ $key }}">{{ $label }}</option>@endforeach</select><label for="health-body-area">Zona del cuerpo</label></div>@error('bodyArea')<small class="text-danger">{{ $message }}</small>@enderror</div>
                            <div class="col-md-5"><div class="md-text-field"><input wire:model="severity" id="health-severity" type="number" min="1" max="5"><label for="health-severity">Intensidad (1–5)</label></div>@error('severity')<small class="text-danger">{{ $message }}</small>@enderror</div>
                            @if($bodyArea === 'other')<div class="col-12"><div class="md-text-field"><input wire:model="customBodyArea" id="health-custom-body-area" type="text"><label for="health-custom-body-area">Describe la zona</label></div>@error('customBodyArea')<small class="text-danger">{{ $message }}</small>@enderror</div>@endif
                        @elseif($type === 'illness')
                            <div class="col-12"><div class="md-text-field"><select wire:model.live="illness" id="health-illness"><option value="">Selecciona una enfermedad</option>@foreach($commonIllnesses as $key => $label)<option value="{{ $key }}">{{ $label }}</option>@endforeach</select><label for="health-illness">Enfermedad</label></div>@error('illness')<small class="text-danger">{{ $message }}</small>@enderror</div>
                            @if($illness === 'other')<div class="col-12"><div class="md-text-field"><input wire:model="customIllness" id="health-custom-illness" type="text"><label for="health-custom-illness">¿Cuál enfermedad?</label></div>@error('customIllness')<small class="text-danger">{{ $message }}</small>@enderror</div>@endif
                        @elseif(in_array($type, ['appointment', 'checkup']))
                            <div class="col-md-6"><div class="md-text-field"><input wire:model="provider" id="health-provider" type="text"><label for="health-provider">Profesional o centro</label></div></div>
                            <div class="col-md-6"><div class="md-text-field"><input wire:model="specialty" id="health-specialty" type="text"><label for="health-specialty">Especialidad</label></div></div>
                        @elseif($type === 'vaccination')
                            <div class="col-md-7"><div class="md-text-field"><input wire:model="vaccineName" id="health-vaccine" type="text"><label for="health-vaccine">Vacuna</label></div></div>
                            <div class="col-md-5"><div class="md-text-field"><input wire:model="vaccineDose" id="health-dose" type="text"><label for="health-dose">Dosis</label></div></div>
                        @endif
                        <div class="col-12"><div class="md-text-field"><textarea wire:model="notes" id="health-notes" rows="4"></textarea><label for="health-notes">Notas (opcional)</label></div></div>
                    </div>
                    @if(in_array($type, ['appointment', 'checkup', 'procedure']))<p class="health-form-hint"><i class="bi bi-calendar-plus"></i> Si la fecha es futura, se creará y enlazará automáticamente una tarea en tu agenda.</p>@endif
                </div>
                <div class="md-dialog-actions"><button type="button" wire:click="closeForm" class="md-btn-text">Cancelar</button><button type="submit" class="md-btn-filled">Guardar registro</button></div>
            </form>
        </section>
    @endif

    @if($showTaskForm)
        <div class="md-dialog-backdrop" wire:click="$set('showTaskForm', false)"></div>
        <section class="md-dialog health-dialog health-dialog--small" role="dialog" aria-modal="true" aria-labelledby="health-pending-title">
            <div class="md-dialog-header"><h2 id="health-pending-title">Nuevo pendiente de salud</h2><button wire:click="$set('showTaskForm', false)" class="md-btn-icon"><i class="bi bi-x-lg"></i></button></div>
            <form wire:submit="savePendingTask"><div class="md-dialog-body"><div class="md-text-field mb-3"><input wire:model="pendingTitle" id="health-pending" type="text"><label for="health-pending">¿Qué necesitas hacer?</label></div>@error('pendingTitle')<small class="text-danger">{{ $message }}</small>@enderror<div class="md-text-field"><input wire:model="pendingDate" id="health-pending-date" type="date"><label for="health-pending-date">Fecha prevista</label></div><p class="health-form-hint"><i class="bi bi-info-circle"></i> Se crea como tarea de Salud; úsala para pedir una cita o investigar una vacuna.</p></div><div class="md-dialog-actions"><button type="button" wire:click="$set('showTaskForm', false)" class="md-btn-text">Cancelar</button><button type="submit" class="md-btn-filled">Crear pendiente</button></div></form>
        </section>
    @endif
</x-module-shell>
