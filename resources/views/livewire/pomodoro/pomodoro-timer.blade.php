@php
    use App\Support\Ui\DataState;

    $sessionsState = DataState::resolve(visible: $todaySessions->count(), total: $todaySessions->count());
@endphp

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

    <x-slot:rail>
        <x-context-widget title="{{ $monthData['label'] }}" icon="bi-calendar3">
            @include('livewire.pomodoro.partials.month-calendar')
        </x-context-widget>
        <x-context-widget title="Enfoque del mes" icon="bi-stopwatch" tone="success">
            <dl class="md-context-list">
                <div><dt>Tiempo registrado</dt><dd>{{ intdiv($monthData['focus_minutes'], 60) }} h {{ $monthData['focus_minutes'] % 60 }} min</dd></div>
                <div><dt>Metas alcanzadas</dt><dd>{{ $monthData['completed_days'] }} días</dd></div>
            </dl>
        </x-context-widget>
    </x-slot:rail>

    <x-ui.section title="{{ $displayDate->translatedFormat('l d \d\e F') }}"
                  description="Meta: {{ $dailyGoal }} min · {{ max($dailyGoal - $totalMinutes, 0) }} min restantes"
                  :level="2">
        <x-ui.metric-grid label="Resumen de enfoque">
            <x-ui.metric label="Sesiones" icon="bi-check2-circle" tone="success" :value="$sessionCount" unit="sesiones" />
            <x-ui.metric label="Tiempo registrado" icon="bi-stopwatch" tone="info"
                         :value="intdiv($totalSeconds, 3600).' h '.intdiv($totalSeconds % 3600, 60).' min'" />
            <x-ui.metric label="Avance de la meta" icon="bi-trophy" tone="primary" :value="$progressPercentage" unit="%"
                         :support="$dailyGoal > 0 && $progressPercentage >= 100 ? 'Meta alcanzada' : null">
                <x-ui.progress :value="min($progressPercentage, 100)" label="Avance de la meta diaria"
                               :valueText="min($progressPercentage, 100).'%'" />
            </x-ui.metric>
        </x-ui.metric-grid>
    </x-ui.section>

    <x-ui.card variant="elevated">
        <div class="pomodoro-stage">
            <div class="md-chip-rail" role="group" aria-label="Modo del temporizador">
                <button type="button" @click="setMode('work')" class="md-chip md-chip-filter pomodoro-mode--work"
                        :class="mode === 'work' ? 'selected' : ''" :aria-pressed="mode === 'work'">Trabajo</button>
                <button type="button" @click="setMode('shortBreak')" class="md-chip md-chip-filter"
                        :class="mode === 'shortBreak' ? 'selected' : ''" :aria-pressed="mode === 'shortBreak'">Descanso corto</button>
                <button type="button" @click="setMode('longBreak')" class="md-chip md-chip-filter"
                        :class="mode === 'longBreak' ? 'selected' : ''" :aria-pressed="mode === 'longBreak'">Descanso largo</button>
            </div>

            <div class="pomodoro-dial">
                <svg viewBox="0 0 200 200" class="pomodoro-dial__svg" aria-hidden="true">
                    <circle cx="100" cy="100" r="90" fill="none" stroke="var(--md-sys-color-surface-container-highest)" stroke-width="8"/>
                    <circle cx="100" cy="100" r="90" fill="none"
                            :stroke="mode === 'work' ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)'" stroke-width="8"
                            :stroke-dasharray="2 * 3.14159 * 90" :stroke-dashoffset="2 * 3.14159 * 90 * (1 - progress)" stroke-linecap="round"/>
                </svg>
                <div class="pomodoro-dial__readout">
                    <span class="md-display-small pomodoro-dial__time" x-text="displayTime" role="timer" aria-live="off"></span>
                    <span class="md-label-medium pomodoro-dial__mode" x-text="mode === 'work' ? 'Trabajo' : 'Descanso'"></span>
                </div>
            </div>

            <div class="pomodoro-controls">
                <button type="button" @click="toggle()" class="md-btn-filled md-btn--lg"
                        :class="mode === 'work' ? 'md-btn--danger' : ''" :disabled="isCompleting">
                    <i class="bi" :class="isRunning ? 'bi-pause-fill' : 'bi-play-fill'" aria-hidden="true"></i>
                    <span x-text="isCompleting ? 'Guardando…' : (isRunning ? 'Pausar' : 'Iniciar')"></span>
                </button>
                <button type="button" @click="reset()" class="md-btn-outlined md-btn--lg"
                        :disabled="isCompleting || pendingCompletion" aria-label="Reiniciar el temporizador">
                    <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
                </button>
            </div>

            <p x-show="errorMessage" x-text="errorMessage" x-cloak class="md-body-small pomodoro-error" role="alert"></p>

            <div class="pomodoro-description">
                <x-ui.field name="pomodoroDescription" label="¿En qué trabajas?" x-model="description" />
            </div>
        </div>
    </x-ui.card>

    <x-ui.section title="Registrar tiempo manual"
                  description="Indica el intervalo trabajado; la duración se calculará automáticamente."
                  :level="3">
        <x-ui.card variant="outlined">
            <form wire:submit="saveManualSession">
                <div class="md-field-pair">
                    <x-ui.field name="manualStart" label="Inicio" type="datetime-local" wire:model.live="manualStart" />
                    <x-ui.field name="manualEnd" label="Fin" type="datetime-local" wire:model.live="manualEnd" />
                </div>

                <x-ui.field name="manualDescription" label="Descripción (opcional)" wire:model="manualDescription" />

                @if ($manualDurationSeconds !== null)
                    <p class="md-body-medium" role="status">
                        Duración calculada: <strong>{{ intdiv($manualDurationSeconds, 3600) }} h {{ intdiv($manualDurationSeconds % 3600, 60) }} min</strong>
                    </p>
                @endif

                <x-ui.action variant="tonal" type="submit" icon="bi-save">Guardar registro</x-ui.action>
            </form>
        </x-ui.card>
    </x-ui.section>

    <x-ui.section title="Esta semana"
                  description="{{ $weekStart->format('d M') }} – {{ $weekStart->copy()->endOfWeek()->format('d M') }}"
                  :level="3">
        <x-ui.card variant="elevated">
            <div class="pomodoro-week" role="table" aria-label="Enfoque de la semana">
                @foreach ($weekDays as $day)
                    <div class="pomodoro-week__row {{ $day['date']->isSameDay($selectedDate) ? 'is-selected' : '' }}"
                         role="row" wire:key="pomodoro-week-{{ $day['date']->toDateString() }}">
                        <x-ui.action variant="text" size="sm" wire:click="$set('selectedDate', '{{ $day['date']->toDateString() }}')">
                            {{ $day['date']->translatedFormat('D d') }}
                        </x-ui.action>
                        <span class="pomodoro-week__value md-body-small">{{ intdiv($day['minutes'], 60) }} h {{ $day['minutes'] % 60 }} min</span>
                        <span class="pomodoro-week__value md-body-small">Meta {{ $day['goal'] }} min</span>
                        <span class="pomodoro-week__value"><x-ui.chip variant="tonal">{{ $day['percentage'] }}%</x-ui.chip></span>
                    </div>
                @endforeach
            </div>
        </x-ui.card>
    </x-ui.section>

    <x-ui.section title="Sesiones del día" :level="3">
        @if ($sessionsState === DataState::CONTENT)
            <x-ui.list label="Sesiones del día">
                @foreach ($todaySessions as $session)
                    <x-ui.list-item :headline="intdiv($session->duration, 3600).' h '.intdiv($session->duration % 3600, 60).' min'"
                                    :supporting="$session->description"
                                    wire:key="pomodoro-session-{{ $session->id }}">
                        <x-slot:leading><x-ui.icon name="bi-check-circle-fill" tone="success" /></x-slot:leading>
                        <x-slot:trailing>
                            <x-ui.destructive-action label="Eliminar la sesión" :iconOnly="true"
                                                     action="deleteSession('{{ $session->id }}')"
                                                     title="Eliminar sesión"
                                                     message="La sesión de enfoque se elimina de forma permanente." />
                        </x-slot:trailing>
                    </x-ui.list-item>
                @endforeach
            </x-ui.list>
        @else
            <x-ui.state variant="empty" icon="bi-stopwatch" title="Sin sesiones completadas este día"
                        message="Inicia el temporizador o registra un intervalo manual." />
        @endif
    </x-ui.section>
</x-module-shell>
