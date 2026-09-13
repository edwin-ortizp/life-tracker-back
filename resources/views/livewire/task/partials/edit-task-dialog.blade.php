<x-create-modal :state="'showDialog'" :title="$dialogTitle ?? 'Editar tarea'" icon="bi-list-task" module="tasks"
    :wide="true" :client-close="$localEditor ?? false" :title-expression="($localEditor ?? false) ? '$wire.editingId ? \'Editar tarea\' : \'Nueva tarea\'' : null"
    :steps="[
        ['label' => 'Lo básico'],
        ['label' => 'Clasificación'],
        ['label' => 'Programación'],
    ]"
    save-action="save" save-label="{{ $saveLabel ?? 'Actualizar' }}"
    :bulk-action="($localEditor ?? false) || !$editingId ? 'saveBulk' : null" bulk-save-label="Crear tareas"
    close-action="closeForm">

    <div x-show="step === 0" class="lt-cm-form">
        <div x-show="!bulk">
            <div class="md-text-field"><input type="text" wire:model="title" placeholder=" " id="{{ $dialogId }}-title"><label for="{{ $dialogId }}-title">Título</label></div>
            @error('title')<p class="md-error" role="alert" @if($localEditor ?? false) x-show="submitted" @endif>{{ $message }}</p>@enderror
        </div>
        <div x-show="bulk" x-cloak>
            <div class="md-text-field">
                <textarea wire:model="bulkTitles" placeholder=" " id="{{ $dialogId }}-bulk-titles" rows="6"></textarea>
                <label for="{{ $dialogId }}-bulk-titles">Tareas</label>
                @error('bulkTitles')
                    <div class="md-supporting-text" style="color: var(--md-sys-color-error);">{{ $message }}</div>
                @enderror
            </div>
        </div>

        @include('partials.markdown-editor', [
            'model' => 'description',
            'mode' => 'descriptionMode',
            'modeValue' => $descriptionMode,
            'content' => $description,
            'id' => $dialogId.'-description',
            'deferred' => $localEditor ?? false,
            'placeholder' => 'Detalles de la tarea. Admite Markdown.',
        ])

        @if (($localEditor ?? false) || ! $editingId)
            <label class="lt-cm-switch" @if($localEditor ?? false) x-show="!$wire.editingId" @endif>
                <input type="checkbox" x-model="bulk">
                <span class="lt-cm-switch__track" aria-hidden="true"><span class="lt-cm-switch__thumb"></span></span>
                <span class="lt-cm-switch__text">
                    <b>Varias a la vez</b>
                    <small x-text="bulk ? 'Una tarea por línea; los campos comunes se aplican a todas.' : 'Crea de golpe una lista de tareas con los mismos campos.'"></small>
                </span>
            </label>
        @endif
    </div>

    <div x-show="step === 1" x-cloak class="lt-cm-form">
        <div class="lt-cm-row lt-cm-row--3">
            <div class="md-text-field"><select wire:model="category" id="{{ $dialogId }}-category"><option value="">Sin categoría</option>@foreach ($categories as $key => $label)<option value="{{ $key }}">{{ $label }}</option>@endforeach</select><label for="{{ $dialogId }}-category">Categoría</label></div>
            <div class="md-text-field"><select wire:model="priority" id="{{ $dialogId }}-priority"><option value="">Sin prioridad</option>@foreach ($priorities as $key => $label)<option value="{{ $key }}">{{ $label }}</option>@endforeach</select><label for="{{ $dialogId }}-priority">Prioridad</label></div>
            <div class="md-text-field"><select wire:model="size" id="{{ $dialogId }}-size"><option value="">Sin tamaño</option>@foreach ($sizes as $key => $label)<option value="{{ $key }}">{{ $label }}</option>@endforeach</select><label for="{{ $dialogId }}-size">Tamaño</label></div>
        </div>
        <label class="md-checkbox"><input type="checkbox" wire:model="isPrivate"><i class="bi bi-lock"></i> Tarea privada</label>
        <p class="lt-cm-hint"><i class="bi bi-info-circle" aria-hidden="true"></i> La prioridad ordena la lista y tiñe la tarjeta en la semana.</p>
    </div>

    <div x-show="step === 2" x-cloak class="lt-cm-form">
        @include('livewire.task.partials.schedule-fields', ['idPrefix' => $dialogId, 'startModel' => 'startDate', 'startTimeModel' => 'startTime', 'endModel' => 'endDate', 'endTimeModel' => 'endTime', 'durationAction' => 'applyDuration'])
        @if ($showRecurrenceFields ?? false)
            <div class="d-flex flex-wrap align-items-center gap-3">
                @if ($localEditor ?? false)
                    <label class="md-checkbox"><input type="checkbox" wire:model="isRecurrent"><i class="bi bi-arrow-repeat"></i> Tarea recurrente</label>
                    <div x-show="$wire.isRecurrent">
                        <span class="md-chip-tonal" x-show="$wire.nativeRecurrenceRule" x-text="$wire.nativeRecurrenceRule" title="Esta regla CalDAV se conserva sin cambios"></span>
                        <div class="md-text-field lt-cm-field--sm" x-show="!$wire.nativeRecurrenceRule"><input type="number" min="1" wire:model="recurrenceIntervalDays" placeholder=" " id="{{ $dialogId }}-recurrence-days"><label for="{{ $dialogId }}-recurrence-days">Repetir cada (días)</label></div>
                    </div>
                @else
                <label class="md-checkbox"><input type="checkbox" wire:model.live="isRecurrent"><i class="bi bi-arrow-repeat"></i> Tarea recurrente</label>
                @if ($isRecurrent)
                    @if (($nativeRecurrenceRule ?? '') !== '')
                        <span class="md-chip-tonal" title="Esta regla CalDAV se conserva sin cambios"><i class="bi bi-calendar2-week"></i> {{ $nativeRecurrenceRule }}</span>
                    @else
                        <div class="md-text-field lt-cm-field--sm"><input type="number" min="1" wire:model="recurrenceIntervalDays" placeholder=" " id="{{ $dialogId }}-recurrence-days"><label for="{{ $dialogId }}-recurrence-days">Repetir cada (días)</label></div>
                    @endif
                @endif
                @endif
            </div>
        @endif
    </div>

    @if ($showCompletionAction ?? false)
        <x-slot:actions>
            <button type="button" wire:click="toggleComplete('{{ $editingId }}')" class="md-btn-text md-dialog-actions__lead"><i class="bi bi-{{ $completed ? 'arrow-counterclockwise' : 'check2-circle' }}"></i> {{ $completed ? 'Reabrir' : 'Completar' }}</button>
        </x-slot:actions>
    @endif
</x-create-modal>
