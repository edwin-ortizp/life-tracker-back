<div>
    {{-- Header --}}
    <div class="d-flex align-items-center justify-content-between mb-4">
        <h4 class="mb-0"><i class="bi bi-kanban text-info"></i> Kanban (Eisenhower)</h4>
        <a href="{{ route('tasks') }}" class="btn btn-sm btn-outline-secondary">
            <i class="bi bi-list-task"></i> Vista Lista
        </a>
    </div>

    {{-- Kanban Grid --}}
    <div class="row g-3">
        @foreach ($columns as $key => $column)
            <div class="col-md-6 col-lg-3">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-{{ $column['color'] }} bg-opacity-10 border-0">
                        <h6 class="mb-0 text-{{ $column['color'] }}">
                            {{ $column['label'] }}
                            <span class="badge bg-{{ $column['color'] }}">{{ $column['tasks']->count() }}</span>
                        </h6>
                    </div>
                    <div class="card-body p-2" style="min-height: 200px; max-height: 500px; overflow-y: auto;">
                        @forelse ($column['tasks'] as $task)
                            <div class="card mb-2 {{ $task->completed ? 'bg-light' : '' }}" wire:key="kanban-{{ $task->id }}">
                                <div class="card-body p-2">
                                    <div class="d-flex align-items-start gap-2">
                                        <button wire:click="toggleComplete('{{ $task->id }}')" class="btn p-0 mt-1">
                                            <div class="d-flex align-items-center justify-content-center rounded-circle {{ $task->completed ? 'bg-success text-white' : 'border border-2' }}"
                                                 style="width: 20px; height: 20px;">
                                                @if ($task->completed)
                                                    <i class="bi bi-check small" style="font-size: 0.7rem;"></i>
                                                @endif
                                            </div>
                                        </button>
                                        <div class="min-w-0">
                                            <small class="{{ $task->completed ? 'text-decoration-line-through text-muted' : 'fw-medium' }}">
                                                {{ $task->title }}
                                            </small>
                                            @if ($task->category)
                                                <br><span class="badge bg-secondary bg-opacity-10 text-secondary" style="font-size: 0.6rem;">{{ $task->category }}</span>
                                            @endif
                                        </div>
                                    </div>
                                </div>
                            </div>
                        @empty
                            <div class="text-center py-3 text-muted">
                                <small>Sin tareas</small>
                            </div>
                        @endforelse
                    </div>
                </div>
            </div>
        @endforeach
    </div>
</div>
