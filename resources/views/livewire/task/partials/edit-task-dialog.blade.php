<template x-if="showDialog">
    <div>
        <div class="md-dialog-scrim" wire:click="closeForm"></div>
        <div class="md-dialog md-dialog--wide" @click.stop>
            <h2 class="md-dialog-headline md-headline-small">{{ $dialogTitle ?? 'Editar tarea' }}</h2>
            <div class="md-dialog-content">
                <div class="d-flex flex-column gap-3">
                    <div class="md-text-field"><input type="text" wire:model="title" placeholder=" " id="{{ $dialogId }}-title"><label for="{{ $dialogId }}-title">Título</label></div>
                    @include('partials.markdown-editor', [
                        'model' => 'description',
                        'mode' => 'descriptionMode',
                        'modeValue' => $descriptionMode,
                        'content' => $description,
                        'id' => $dialogId.'-description',
                        'placeholder' => 'Detalles de la tarea. Admite Markdown.',
                    ])
                    <div class="row g-3">
                        <div class="col-md-4"><div class="md-text-field"><select wire:model="category" id="{{ $dialogId }}-category"><option value="">Sin categoría</option>@foreach ($categories as $key => $label)<option value="{{ $key }}">{{ $label }}</option>@endforeach</select><label for="{{ $dialogId }}-category">Categoría</label></div></div>
                        <div class="col-md-4"><div class="md-text-field"><select wire:model="priority" id="{{ $dialogId }}-priority"><option value="">Sin prioridad</option>@foreach ($priorities as $key => $label)<option value="{{ $key }}">{{ $label }}</option>@endforeach</select><label for="{{ $dialogId }}-priority">Prioridad</label></div></div>
                        <div class="col-md-4"><div class="md-text-field"><select wire:model="size" id="{{ $dialogId }}-size"><option value="">Sin tamaño</option>@foreach ($sizes as $key => $label)<option value="{{ $key }}">{{ $label }}</option>@endforeach</select><label for="{{ $dialogId }}-size">Tamaño</label></div></div>
                    </div>
                    @include('livewire.task.partials.schedule-fields', ['idPrefix' => $dialogId, 'startModel' => 'startDate', 'endModel' => 'endDate', 'durationAction' => 'applyDuration'])
                    <label class="md-checkbox"><input type="checkbox" wire:model="isPrivate"><i class="bi bi-lock"></i> Tarea privada</label>
                    @if ($showRecurrenceFields ?? false)
                        <div class="d-flex flex-wrap align-items-center gap-3">
                            <label class="md-checkbox"><input type="checkbox" wire:model.live="isRecurrent"><i class="bi bi-arrow-repeat"></i> Tarea recurrente</label>
                            @if ($isRecurrent)
                                <div class="md-text-field" style="width: 170px;"><input type="number" min="1" wire:model="recurrenceIntervalDays" placeholder=" " id="{{ $dialogId }}-recurrence-days"><label for="{{ $dialogId }}-recurrence-days">Repetir cada (días)</label></div>
                            @endif
                        </div>
                    @endif
                </div>
            </div>
            <div class="md-dialog-actions">
                @if ($showCompletionAction ?? false)
                    <button wire:click="toggleComplete('{{ $editingId }}')" class="md-btn-text" style="margin-right: auto;"><i class="bi bi-{{ $completed ? 'arrow-counterclockwise' : 'check2-circle' }}"></i> {{ $completed ? 'Reabrir' : 'Completar' }}</button>
                @endif
                <button wire:click="closeForm" class="md-btn-text">Cancelar</button>
                <button wire:click="save" class="md-btn-filled"><i class="bi bi-check-lg"></i> {{ $saveLabel ?? 'Actualizar' }}</button>
            </div>
        </div>
    </div>
</template>
