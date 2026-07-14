<x-module-shell module="tasks" x-data="{ showDialog: @entangle('showForm'), showRecurringDialog: @entangle('showRecurringCompletion') }">
<section class="task-flow-page">
    @forelse ($lanes as $lane)
        <section class="task-flow-lane" wire:key="flow-lane-{{ $lane['laneKey'] }}" aria-labelledby="flow-lane-{{ $lane['laneKey'] }}">
            <header class="task-flow-lane-header">
                <div>
                    <p class="task-flow-lane-kicker">Carril</p>
                    <h2 id="flow-lane-{{ $lane['laneKey'] }}">{{ $lane['label'] }}</h2>
                </div>
                <span class="md-chip-tonal md-chip-tonal--primary">{{ $lane['total'] }} tareas</span>
            </header>

            <div class="task-flow-scroll" tabindex="0" aria-label="Secuencia de {{ $lane['label'] }}">
                <ol class="task-flow-track">
                    @foreach ($lane['tasks'] as $task)
                        <li class="task-flow-step {{ $task->completed ? 'is-completed' : '' }}" wire:key="flow-task-{{ $task->id }}">
                            <article class="task-flow-card">
                                <button wire:click="openForm('{{ $task->id }}')" class="task-flow-card-main" aria-label="Editar tarea: {{ $task->title }}">
                                    <span class="task-flow-position">{{ $loop->iteration }}</span>
                                    <span class="task-flow-card-title">{{ $task->title }}</span>
                                    <span class="task-flow-card-meta">
                                        @if ($task->completed)<i class="bi bi-check2-circle"></i> Completada @else <i class="bi bi-circle"></i> Pendiente @endif
                                        @if ($task->size)<span>{{ $task->size }}</span>@endif
                                    </span>
                                </button>
                                <div class="task-flow-card-actions">
                                    <button wire:click="toggleComplete('{{ $task->id }}')" class="md-btn-icon" title="{{ $task->completed ? 'Marcar pendiente' : 'Completar' }}" aria-label="{{ $task->completed ? 'Marcar pendiente' : 'Completar' }} {{ $task->title }}"><i class="bi bi-{{ $task->completed ? 'arrow-counterclockwise' : 'check-lg' }}"></i></button>
                                    <button wire:click="movePrevious('{{ $task->id }}')" @disabled($loop->first) class="md-btn-icon" title="Mover antes" aria-label="Mover {{ $task->title }} antes"><i class="bi bi-arrow-left"></i></button>
                                    <button wire:click="moveNext('{{ $task->id }}')" @disabled($loop->last && $lane['total'] === $lane['tasks']->count()) class="md-btn-icon" title="Mover después" aria-label="Mover {{ $task->title }} después"><i class="bi bi-arrow-right"></i></button>
                                </div>
                            </article>
                        </li>
                    @endforeach
                </ol>
            </div>

            @if ($lane['total'] > $lane['tasks']->count())
                <div class="task-flow-more">
                    <button wire:click="loadMore('{{ $lane['laneKey'] }}')" class="md-btn md-btn-outlined"><i class="bi bi-plus-lg"></i> Ver 30 tareas más</button>
                </div>
            @endif
        </section>
    @empty
        <div class="md-card-filled task-flow-empty">
            <i class="bi bi-signpost-2"></i>
            <p class="md-title-medium mb-1">Aún no hay trabajo pendiente por ordenar</p>
            <p class="mb-0">Crea una tarea pendiente y asígnale una categoría para verla aquí.</p>
        </div>
    @endforelse
</section>

@include('livewire.task.partials.edit-task-dialog', ['dialogId' => 'flow-task', 'showCompletionAction' => true])
</x-module-shell>
