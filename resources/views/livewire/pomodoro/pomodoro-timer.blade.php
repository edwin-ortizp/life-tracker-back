<x-module-shell module="pomodoro" x-data="pomodoroTimer({
    workDuration: {{ $workDuration }},
    shortBreak: {{ $shortBreak }},
    longBreak: {{ $longBreak }},
    storageKey: 'life-tracker:pomodoro:{{ auth()->id() }}',
    saveSession: (startedAt, endedAt, description, clientToken) => $wire.saveSession(startedAt, endedAt, description, clientToken)
})">
    <x-slot:actions>
        <x-date-navigator :date="$selectedDate" format="D d M Y" />
    </x-slot:actions>

    <div class="md-summary-strip mb-3" aria-label="Resumen de enfoque">
        <span class="md-count-badge--success">{{ $sessionCount }} sesiones</span>
        <span class="md-count-badge--info">{{ $totalMinutes }} min</span>
    </div>

    <div class="md-module-workspace">
        <div class="md-module-primary">

    <section class="md-card-elevated mb-3">
        <div class="d-flex align-items-start justify-content-between gap-3 mb-3 flex-wrap">
            <div>
                <div class="md-title-medium">{{ $displayDate->translatedFormat('l d \d\e F') }}</div>
                <div class="md-body-small" style="color: var(--md-sys-color-on-surface-variant);">Meta: {{ $dailyGoal }} min · {{ max($dailyGoal - $totalMinutes, 0) }} min restantes</div>
            </div>
            <span class="md-title-large" style="color: var(--md-sys-color-primary);">{{ $progressPercentage }}%</span>
        </div>
        <div class="md-progress-linear" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="{{ min($progressPercentage, 100) }}">
            <div class="md-progress-linear-bar" style="width: {{ min($progressPercentage, 100) }}%"></div>
        </div>
        <div class="d-flex justify-content-between mt-2 md-body-small" style="color: var(--md-sys-color-on-surface-variant);">
            <span>{{ intdiv($totalSeconds, 3600) }} h {{ intdiv($totalSeconds % 3600, 60) }} min registrados</span>
            @if ($dailyGoal > 0 && $progressPercentage >= 100)
                <span><i class="bi bi-trophy-fill"></i> Meta alcanzada</span>
            @endif
        </div>
    </section>

    <section class="md-card-elevated text-center mb-3" style="padding: 32px 16px;">
        <div class="md-chip-group justify-content-center mb-4">
            <button @click="setMode('work')" class="md-chip md-chip-filter" :class="mode === 'work' ? 'selected' : ''"
                    :style="mode === 'work' ? 'background: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); border-color: transparent;' : ''">Trabajo</button>
            <button @click="setMode('shortBreak')" class="md-chip md-chip-filter" :class="mode === 'shortBreak' ? 'selected' : ''">Descanso corto</button>
            <button @click="setMode('longBreak')" class="md-chip md-chip-filter" :class="mode === 'longBreak' ? 'selected' : ''">Descanso largo</button>
        </div>

        <div class="position-relative d-inline-block mb-4">
            <div style="width: 200px; height: 200px;" class="position-relative">
                <svg viewBox="0 0 200 200" style="transform: rotate(-90deg);">
                    <circle cx="100" cy="100" r="90" fill="none" stroke="var(--md-sys-color-surface-container-highest)" stroke-width="8"/>
                    <circle cx="100" cy="100" r="90" fill="none" :stroke="mode === 'work' ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)'" stroke-width="8"
                            :stroke-dasharray="2 * 3.14159 * 90" :stroke-dashoffset="2 * 3.14159 * 90 * (1 - progress)" stroke-linecap="round"/>
                </svg>
                <div class="position-absolute top-50 start-50 translate-middle text-center">
                    <div class="md-display-small" x-text="displayTime" style="color: var(--md-sys-color-on-surface);"></div>
                    <span class="md-label-medium" style="color: var(--md-sys-color-on-surface-variant);" x-text="mode === 'work' ? 'Trabajo' : 'Descanso'"></span>
                </div>
            </div>
        </div>

        <div class="d-flex justify-content-center gap-3">
            <button @click="toggle()" class="md-btn-filled" style="height: 48px; padding: 0 32px;" :style="mode === 'work' ? 'background: var(--md-sys-color-error); color: var(--md-sys-color-on-error);' : ''" :disabled="isCompleting">
                <i class="bi" :class="isRunning ? 'bi-pause-fill' : 'bi-play-fill'"></i><span x-text="isCompleting ? 'Guardando…' : (isRunning ? 'Pausar' : 'Iniciar')"></span>
            </button>
            <button @click="reset()" class="md-btn-outlined" style="height: 48px; padding: 0 24px;" :disabled="isCompleting || pendingCompletion"><i class="bi bi-arrow-counterclockwise"></i></button>
        </div>
        <p x-show="errorMessage" x-text="errorMessage" class="md-body-small mt-3 mb-0" style="color: var(--md-sys-color-error);" role="alert"></p>

        <div class="mt-4 mx-auto" style="max-width: 320px;">
            <div class="md-text-field"><input type="text" x-model="description" placeholder=" " id="pom-desc"><label for="pom-desc">¿En qué trabajas?</label></div>
        </div>
    </section>

    <section class="md-card-outlined mb-3">
        <h2 class="md-title-small mb-1"><i class="bi bi-plus-circle"></i> Registrar tiempo manual</h2>
        <p class="md-body-small mb-3" style="color: var(--md-sys-color-on-surface-variant);">Indica el intervalo trabajado; la duración se calculará automáticamente.</p>
        <form wire:submit="saveManualSession" class="row g-3">
            <div class="col-md-6">
                <div class="md-text-field"><input wire:model.live="manualStart" type="datetime-local" id="manual-start" placeholder=" "><label for="manual-start">Inicio</label></div>
                @error('manualStart') <small style="color: var(--md-sys-color-error);">{{ $message }}</small> @enderror
            </div>
            <div class="col-md-6">
                <div class="md-text-field"><input wire:model.live="manualEnd" type="datetime-local" id="manual-end" placeholder=" "><label for="manual-end">Fin</label></div>
                @error('manualEnd') <small style="color: var(--md-sys-color-error);">{{ $message }}</small> @enderror
            </div>
            <div class="col-12"><div class="md-text-field"><input wire:model="manualDescription" type="text" id="manual-description" placeholder=" "><label for="manual-description">Descripción (opcional)</label></div></div>
            @if ($manualDurationSeconds !== null)
                <div class="col-12 md-body-medium" role="status">
                    Duración calculada: <strong>{{ intdiv($manualDurationSeconds, 3600) }} h {{ intdiv($manualDurationSeconds % 3600, 60) }} min</strong>
                </div>
            @endif
            <div class="col-12"><button type="submit" class="md-btn-tonal"><i class="bi bi-save"></i> Guardar registro</button></div>
        </form>
    </section>

    <section class="md-card-elevated mb-3" style="padding: 0; overflow: hidden;">
        <div style="padding: 16px 16px 8px;"><h2 class="md-title-small mb-0"><i class="bi bi-calendar-week"></i> Esta semana · {{ $weekStart->format('d M') }} – {{ $weekStart->copy()->endOfWeek()->format('d M') }}</h2></div>
        <div class="table-responsive">
            <table class="table mb-0 align-middle">
                <thead><tr><th>Día</th><th class="text-end">Tiempo</th><th class="text-end">Meta</th><th class="text-end">Progreso</th></tr></thead>
                <tbody>
                    @foreach ($weekDays as $day)
                        <tr wire:key="pomodoro-week-{{ $day['date']->toDateString() }}" class="{{ $day['date']->isSameDay($selectedDate) ? 'table-active' : '' }}">
                            <td><button wire:click="$set('selectedDate', '{{ $day['date']->toDateString() }}')" class="md-btn-text" style="min-height: 32px;">{{ $day['date']->translatedFormat('D d') }}</button></td>
                            <td class="text-end">{{ intdiv($day['minutes'], 60) }} h {{ $day['minutes'] % 60 }} min</td>
                            <td class="text-end">{{ $day['goal'] }} min</td>
                            <td class="text-end"><span class="md-chip-tonal">{{ $day['percentage'] }}%</span></td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </section>

    <section class="md-card-elevated" style="padding: 0; overflow: hidden;">
        <div style="padding: 16px 16px 8px;"><h2 class="md-title-small mb-0"><i class="bi bi-clock-history"></i> Sesiones del día</h2></div>
        @forelse ($todaySessions as $session)
            <div class="md-list-item" wire:key="pomodoro-session-{{ $session->id }}">
                <div class="md-list-item-leading"><i class="bi bi-check-circle-fill" style="color: var(--md-custom-color-success); font-size: 1.25rem;"></i></div>
                <div class="md-list-item-content">
                    <div class="md-list-item-headline">{{ intdiv($session->duration, 3600) }} h {{ intdiv($session->duration % 3600, 60) }} min</div>
                    @if ($session->description)<div class="md-list-item-supporting">{{ $session->description }}</div>@endif
                </div>
                <div class="md-list-item-trailing"><button wire:click="deleteSession('{{ $session->id }}')" wire:confirm="¿Eliminar esta sesión?" class="md-btn-icon" style="color: var(--md-sys-color-error);"><i class="bi bi-trash"></i></button></div>
            </div>
        @empty
            <div class="text-center py-4" style="color: var(--md-sys-color-on-surface-variant);"><p class="md-body-medium mb-0">Sin sesiones completadas este día.</p></div>
        @endforelse
    </section>

        </div>
        <aside class="md-context-rail">
            <x-context-widget title="{{ $monthData['label'] }}" icon="bi-calendar3">
                @include('livewire.pomodoro.partials.month-calendar')
            </x-context-widget>
            <x-context-widget title="Enfoque del mes" icon="bi-stopwatch" tone="success">
                <dl class="md-context-list"><div><dt>Tiempo registrado</dt><dd>{{ intdiv($monthData['focus_minutes'], 60) }} h {{ $monthData['focus_minutes'] % 60 }} min</dd></div><div><dt>Metas alcanzadas</dt><dd>{{ $monthData['completed_days'] }} días</dd></div></dl>
            </x-context-widget>
        </aside>
    </div>
</x-module-shell>

