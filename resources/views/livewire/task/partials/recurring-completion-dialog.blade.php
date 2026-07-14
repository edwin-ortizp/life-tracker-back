<template x-if="showRecurringDialog">
    <div>
        <div class="md-dialog-scrim" wire:click="cancelRecurringCompletion"></div>
        <div class="md-dialog" @click.stop>
            <h2 class="md-dialog-headline md-headline-small">Programar próxima repetición</h2>
            <div class="md-dialog-content">
                <p class="md-body-medium">La tarea actual se marcará como completada y se creará la siguiente ocurrencia.</p>
                <div class="md-text-field">
                    <input type="date" wire:model="nextOccurrenceDate" placeholder=" " id="next-occurrence-date">
                    <label for="next-occurrence-date">Próxima fecha</label>
                    @error('nextOccurrenceDate')
                        <div class="md-supporting-text" style="color: var(--md-sys-color-error);">{{ $message }}</div>
                    @enderror
                </div>
            </div>
            <div class="md-dialog-actions">
                <button wire:click="cancelRecurringCompletion" class="md-btn-text">Cancelar</button>
                <button wire:click="confirmRecurringCompletion" class="md-btn-filled"><i class="bi bi-check-lg"></i> Completar y programar</button>
            </div>
        </div>
    </div>
</template>
