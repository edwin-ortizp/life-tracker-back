<x-module-shell module="pomodoro">
    @if ($message)
        <div class="md-card-filled mb-3 py-3" role="status">{{ $message }}</div>
    @endif

    <form wire:submit="save" class="d-grid gap-3">
        <section class="md-card-elevated">
            <h2 class="md-title-medium mb-1">Duración del temporizador</h2>
            <p class="md-body-small mb-3" style="color: var(--md-sys-color-on-surface-variant);">Define la duración predeterminada de cada ciclo.</p>
            <div class="row g-3">
                <div class="col-md-4">
                    <div class="md-text-field"><input type="number" wire:model="workDuration" placeholder=" " id="pom-work" min="1" max="60"><label for="pom-work">Trabajo (min)</label></div>
                    @error('workDuration') <small style="color: var(--md-sys-color-error);">{{ $message }}</small> @enderror
                </div>
                <div class="col-md-4">
                    <div class="md-text-field"><input type="number" wire:model="shortBreak" placeholder=" " id="pom-short" min="1" max="30"><label for="pom-short">Descanso corto (min)</label></div>
                    @error('shortBreak') <small style="color: var(--md-sys-color-error);">{{ $message }}</small> @enderror
                </div>
                <div class="col-md-4">
                    <div class="md-text-field"><input type="number" wire:model="longBreak" placeholder=" " id="pom-long" min="1" max="60"><label for="pom-long">Descanso largo (min)</label></div>
                    @error('longBreak') <small style="color: var(--md-sys-color-error);">{{ $message }}</small> @enderror
                </div>
            </div>
        </section>

        <section class="md-card-elevated">
            <h2 class="md-title-medium mb-1">Metas de trabajo</h2>
            <p class="md-body-small mb-3" style="color: var(--md-sys-color-on-surface-variant);">Establece los minutos de enfoque esperados según el tipo de día.</p>
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="md-text-field"><input wire:model="weekdayGoal" type="number" min="0" max="1440" id="weekday-goal" placeholder=" "><label for="weekday-goal">Lunes a viernes (min)</label></div>
                    @error('weekdayGoal') <small style="color: var(--md-sys-color-error);">{{ $message }}</small> @enderror
                </div>
                <div class="col-md-6">
                    <div class="md-text-field"><input wire:model="weekendGoal" type="number" min="0" max="1440" id="weekend-goal" placeholder=" "><label for="weekend-goal">Fin de semana (min)</label></div>
                    @error('weekendGoal') <small style="color: var(--md-sys-color-error);">{{ $message }}</small> @enderror
                </div>
            </div>
        </section>

        <div><button type="submit" class="md-btn-filled"><i class="bi bi-save"></i> Guardar ajustes</button></div>
    </form>
</x-module-shell>
