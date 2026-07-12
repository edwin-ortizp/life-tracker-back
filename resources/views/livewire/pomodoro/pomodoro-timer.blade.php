<div x-data="pomodoroTimer(@entangle('workDuration'), @entangle('shortBreak'), @entangle('longBreak'))">
    {{-- Header --}}
    <div class="d-flex align-items-center justify-content-between mb-4">
        <h4 class="mb-0"><i class="bi bi-clock text-danger"></i> Pomodoro</h4>
        <div class="d-flex gap-2">
            <span class="badge bg-success">{{ $sessionCount }} sesiones hoy</span>
            <span class="badge bg-info">{{ $totalMinutes }} min total</span>
        </div>
    </div>

    {{-- Timer Display --}}
    <div class="card mb-3 border-0 shadow-sm">
        <div class="card-body text-center py-5">
            {{-- Mode Selector --}}
            <div class="btn-group mb-4">
                <button @click="setMode('work')" class="btn btn-sm" :class="mode === 'work' ? 'btn-danger' : 'btn-outline-danger'">
                    Trabajo
                </button>
                <button @click="setMode('shortBreak')" class="btn btn-sm" :class="mode === 'shortBreak' ? 'btn-success' : 'btn-outline-success'">
                    Descanso corto
                </button>
                <button @click="setMode('longBreak')" class="btn btn-sm" :class="mode === 'longBreak' ? 'btn-primary' : 'btn-outline-primary'">
                    Descanso largo
                </button>
            </div>

            {{-- Timer Circle --}}
            <div class="position-relative d-inline-block mb-4">
                <div style="width: 200px; height: 200px;" class="position-relative">
                    <svg viewBox="0 0 200 200" style="transform: rotate(-90deg);">
                        <circle cx="100" cy="100" r="90" fill="none" stroke="#e9ecef" stroke-width="8"/>
                        <circle cx="100" cy="100" r="90" fill="none"
                                :stroke="mode === 'work' ? '#dc3545' : (mode === 'shortBreak' ? '#198754' : '#0d6efd')"
                                stroke-width="8"
                                :stroke-dasharray="2 * 3.14159 * 90"
                                :stroke-dashoffset="2 * 3.14159 * 90 * (1 - progress)"
                                stroke-linecap="round"/>
                    </svg>
                    <div class="position-absolute top-50 start-50 translate-middle text-center">
                        <div class="fw-bold" style="font-size: 2.5rem;" x-text="displayTime"></div>
                        <small class="text-muted" x-text="mode === 'work' ? 'Trabajo' : (mode === 'shortBreak' ? 'Descanso' : 'Descanso largo')"></small>
                    </div>
                </div>
            </div>

            {{-- Controls --}}
            <div class="d-flex justify-content-center gap-3">
                <button @click="toggle()" class="btn btn-lg" :class="mode === 'work' ? 'btn-danger' : (mode === 'shortBreak' ? 'btn-success' : 'btn-primary')">
                    <i class="bi" :class="isRunning ? 'bi-pause-fill' : 'bi-play-fill'"></i>
                    <span x-text="isRunning ? 'Pausar' : 'Iniciar'"></span>
                </button>
                <button @click="reset()" class="btn btn-lg btn-outline-secondary">
                    <i class="bi bi-arrow-counterclockwise"></i>
                </button>
            </div>

            {{-- Description --}}
            <div class="mt-3" style="max-width: 300px; margin: 0 auto;">
                <input type="text" x-model="description" class="form-control form-control-sm text-center" placeholder="¿En qué estás trabajando?">
            </div>
        </div>
    </div>

    {{-- Settings --}}
    <div class="card mb-3 border-0 shadow-sm">
        <div class="card-header bg-transparent border-0">
            <h6 class="mb-0"><i class="bi bi-gear"></i> Configuración</h6>
        </div>
        <div class="card-body">
            <div class="row g-3">
                <div class="col-4">
                    <label class="form-label small">Trabajo (min)</label>
                    <input type="number" wire:model.live="workDuration" class="form-control form-control-sm" min="1" max="60">
                </div>
                <div class="col-4">
                    <label class="form-label small">Descanso corto</label>
                    <input type="number" wire:model.live="shortBreak" class="form-control form-control-sm" min="1" max="30">
                </div>
                <div class="col-4">
                    <label class="form-label small">Descanso largo</label>
                    <input type="number" wire:model.live="longBreak" class="form-control form-control-sm" min="1" max="60">
                </div>
            </div>
        </div>
    </div>

    {{-- Today's Sessions --}}
    <div class="card border-0 shadow-sm">
        <div class="card-header bg-transparent border-0">
            <h6 class="mb-0"><i class="bi bi-clock-history"></i> Sesiones de hoy</h6>
        </div>
        <div class="card-body pt-0">
            @forelse ($todaySessions as $session)
                <div class="d-flex align-items-center justify-content-between py-2 {{ !$loop->last ? 'border-bottom' : '' }}">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-check-circle-fill text-success"></i>
                        <div>
                            <span class="fw-medium">{{ $session->duration }} min</span>
                            @if ($session->description)
                                <br><small class="text-muted">{{ $session->description }}</small>
                            @endif
                        </div>
                    </div>
                    <button wire:click="deleteSession('{{ $session->id }}')" class="btn btn-sm btn-outline-danger">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            @empty
                <div class="text-center py-3 text-muted">
                    <p class="mb-0">Sin sesiones completadas hoy</p>
                </div>
            @endforelse
        </div>
    </div>
</div>

@script
<script>
Alpine.data('pomodoroTimer', (workDuration, shortBreak, longBreak) => ({
    mode: 'work',
    isRunning: false,
    timeLeft: workDuration * 60,
    totalTime: workDuration * 60,
    interval: null,
    description: '',

    get displayTime() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    },

    get progress() {
        return this.totalTime > 0 ? (this.totalTime - this.timeLeft) / this.totalTime : 0;
    },

    setMode(mode) {
        this.stop();
        this.mode = mode;
        if (mode === 'work') {
            this.totalTime = workDuration * 60;
        } else if (mode === 'shortBreak') {
            this.totalTime = shortBreak * 60;
        } else {
            this.totalTime = longBreak * 60;
        }
        this.timeLeft = this.totalTime;
    },

    toggle() {
        if (this.isRunning) {
            this.stop();
        } else {
            this.start();
        }
    },

    start() {
        this.isRunning = true;
        this.interval = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft <= 0) {
                this.complete();
            }
        }, 1000);
    },

    stop() {
        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    },

    reset() {
        this.stop();
        this.timeLeft = this.totalTime;
    },

    complete() {
        this.stop();
        if (this.mode === 'work') {
            const duration = Math.round(this.totalTime / 60);
            $wire.saveSession(duration, this.description);
            this.description = '';
            if (Notification.permission === 'granted') {
                new Notification('Pomodoro completado!', { body: 'Tiempo de descanso.' });
            }
        } else {
            if (Notification.permission === 'granted') {
                new Notification('Descanso terminado!', { body: 'De vuelta al trabajo.' });
            }
        }
        this.timeLeft = this.totalTime;
    },

    init() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        this.$watch('workDuration', (val) => {
            if (this.mode === 'work' && !this.isRunning) {
                this.totalTime = val * 60;
                this.timeLeft = this.totalTime;
            }
        });
    }
}));
</script>
@endscript
