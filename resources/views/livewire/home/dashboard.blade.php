<div>
    {{-- Header with date navigation --}}
    <div class="d-flex align-items-center justify-content-between mb-4">
        <h4 class="mb-0"><i class="bi bi-house text-primary"></i> Life Tracker</h4>
        <div class="d-flex align-items-center gap-2">
            <button wire:click="previousDay" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-chevron-left"></i>
            </button>
            <button wire:click="today" class="btn btn-sm {{ $selectedDate === now()->toDateString() ? 'btn-primary' : 'btn-outline-primary' }}">
                Hoy
            </button>
            <span class="fw-medium">{{ \Carbon\Carbon::parse($selectedDate)->translatedFormat('l d M Y') }}</span>
            <button wire:click="nextDay" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-chevron-right"></i>
            </button>
        </div>
    </div>

    {{-- Widget Grid --}}
    <div class="row g-3">
        {{-- Water Widget --}}
        <div class="col-md-4 col-6">
            <a href="{{ route('water') }}" class="text-decoration-none">
                <div class="card h-100 border-0 shadow-sm">
                    <div class="card-body text-center">
                        <i class="bi bi-droplet text-primary" style="font-size: 2rem;"></i>
                        <h6 class="mt-2 mb-1 text-dark">Hidratación</h6>
                        <div class="fw-bold text-primary fs-4">{{ number_format($waterTotal) }} ml</div>
                        <div class="progress mt-2" style="height: 6px;">
                            <div class="progress-bar bg-primary" style="width: {{ min(($waterTotal / $waterGoal) * 100, 100) }}%"></div>
                        </div>
                        <small class="text-muted">Meta: {{ number_format($waterGoal) }} ml</small>
                    </div>
                </div>
            </a>
        </div>

        {{-- Mood Widget --}}
        <div class="col-md-4 col-6">
            <a href="{{ route('mood') }}" class="text-decoration-none">
                <div class="card h-100 border-0 shadow-sm">
                    <div class="card-body text-center">
                        <div style="font-size: 2rem;">{{ $lastMood?->emoji ?? '😶' }}</div>
                        <h6 class="mt-2 mb-1 text-dark">Estado</h6>
                        <div class="fw-medium">{{ $lastMood?->text ?? 'Sin registro' }}</div>
                        @if ($lastMood)
                            <small class="text-muted">{{ $lastMood->time }}</small>
                        @endif
                    </div>
                </div>
            </a>
        </div>

        {{-- Energy Widget --}}
        <div class="col-md-4 col-6">
            <a href="{{ route('mood') }}" class="text-decoration-none">
                <div class="card h-100 border-0 shadow-sm">
                    <div class="card-body text-center">
                        <i class="bi bi-lightning-charge text-warning" style="font-size: 2rem;"></i>
                        <h6 class="mt-2 mb-1 text-dark">Energía</h6>
                        <div class="fw-bold text-warning fs-4">{{ $lastEnergy?->level ?? '-' }}/5</div>
                        @if ($lastEnergy?->comment)
                            <small class="text-muted">{{ Str::limit($lastEnergy->comment, 20) }}</small>
                        @endif
                    </div>
                </div>
            </a>
        </div>

        {{-- Habits Widget --}}
        <div class="col-md-4 col-6">
            <a href="{{ route('habits') }}" class="text-decoration-none">
                <div class="card h-100 border-0 shadow-sm">
                    <div class="card-body text-center">
                        <i class="bi bi-check2-square text-success" style="font-size: 2rem;"></i>
                        <h6 class="mt-2 mb-1 text-dark">Hábitos</h6>
                        <div class="fw-bold text-success fs-4">{{ $completedHabits }}/{{ $totalHabits }}</div>
                        <div class="progress mt-2" style="height: 6px;">
                            <div class="progress-bar bg-success" style="width: {{ $totalHabits > 0 ? ($completedHabits / $totalHabits * 100) : 0 }}%"></div>
                        </div>
                    </div>
                </div>
            </a>
        </div>

        {{-- Tasks Widget --}}
        <div class="col-md-4 col-6">
            <a href="{{ route('tasks') }}" class="text-decoration-none">
                <div class="card h-100 border-0 shadow-sm">
                    <div class="card-body text-center">
                        <i class="bi bi-list-task text-info" style="font-size: 2rem;"></i>
                        <h6 class="mt-2 mb-1 text-dark">Tareas</h6>
                        <div class="fw-bold text-info fs-4">{{ $pendingTasks }}</div>
                        <small class="text-muted">pendientes · {{ $completedTasks }} hoy</small>
                    </div>
                </div>
            </a>
        </div>

        {{-- Quick Actions Widget --}}
        <div class="col-md-4 col-6">
            <div class="card h-100 border-0 shadow-sm">
                <div class="card-body text-center">
                    <i class="bi bi-plus-circle text-secondary" style="font-size: 2rem;"></i>
                    <h6 class="mt-2 mb-1">Acciones Rápidas</h6>
                    <div class="d-flex flex-wrap gap-1 justify-content-center mt-2">
                        <a href="{{ route('water') }}" class="btn btn-sm btn-outline-primary">+💧</a>
                        <a href="{{ route('mood') }}" class="btn btn-sm btn-outline-success">+😊</a>
                        <a href="{{ route('habits') }}" class="btn btn-sm btn-outline-warning">+✓</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
