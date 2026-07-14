<x-module-shell module="tasks" x-data="{ showDialog: @entangle('showForm') }">
    <x-slot:actions><div class="md-date-navigator"><button wire:click="previousMonth" class="md-btn-icon" aria-label="Mes anterior"><i class="bi bi-chevron-left"></i></button><span class="md-date-navigator__label text-capitalize">{{ $monthLabel }}</span><button wire:click="nextMonth" class="md-btn-icon" aria-label="Mes siguiente"><i class="bi bi-chevron-right"></i></button></div></x-slot:actions>

    <section class="md-card-elevated p-0 overflow-hidden" aria-label="Cronograma mensual">
        <div class="md-gantt-scroll">
            <div class="md-gantt-timeline" style="--gantt-days: {{ $days->count() }};">
                <div class="md-gantt-header-label">Tarea</div>
                @foreach ($days as $day)
                    <div class="md-gantt-day {{ $day->isToday() ? 'is-today' : '' }}" aria-label="{{ $day->locale('es')->translatedFormat('l j') }}">
                        <span>{{ $day->translatedFormat('D') }}</span><strong>{{ $day->day }}</strong>
                    </div>
                @endforeach

                @forelse ($scheduledTasks as $item)
                    @php($task = $item['task'])
                    <button wire:click="openForm('{{ $task->id }}')" class="md-gantt-task-label md-gantt-open-button {{ $task->completed ? 'is-completed' : '' }}" title="Abrir {{ $task->title }}">
                        <span>{{ $task->title }}</span>
                    </button>
                    <div class="md-gantt-track">
                        <button wire:click="openForm('{{ $task->id }}')" class="md-gantt-bar {{ $task->completed ? 'is-completed' : '' }} {{ $item['span'] === 1 ? 'is-milestone' : '' }}" style="grid-column: {{ $item['column'] }} / span {{ $item['span'] }};" title="Editar {{ $task->title }} · {{ $item['start']->format('d/m') }}–{{ $item['end']->format('d/m') }}">
                            <span>{{ $task->title }}</span>
                        </button>
                    </div>
                @empty
                    <div class="md-gantt-empty">No hay tareas programadas para este mes.</div>
                @endforelse
            </div>
        </div>
    </section>

    <section class="md-card-filled mt-3">
        <div class="d-flex align-items-center gap-2 mb-2"><i class="bi bi-calendar-x"></i><h2 class="md-title-medium mb-0">Sin fecha</h2></div>
        @forelse ($unscheduledTasks as $task)
            <div class="md-list-item px-0"><button wire:click="openForm('{{ $task->id }}')" class="md-list-item-content md-task-open-button"><span class="md-list-item-headline {{ $task->completed ? 'text-decoration-line-through' : '' }}">{{ $task->title }}</span></button></div>
        @empty
            <p class="md-body-medium mb-0">Todas las tareas tienen una fecha asignada.</p>
        @endforelse
    </section>

    @include('livewire.task.partials.edit-task-dialog', ['dialogId' => 'gantt-task'])
</x-module-shell>
