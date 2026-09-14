{{-- Formulario de acontecimiento de una persona. Requiere ManagesRelationshipEvents. --}}
<x-ui.form-dialog :open="$showEventForm" close="$set('showEventForm', false)" submit-action="saveEvent"
                  :title="($editingEventId ? 'Editar' : 'Registrar').' acontecimiento'" icon="bi-calendar-plus" id="relationship-event-dialog"
                  :sections="[
                      'basic' => ['label' => 'Información básica', 'icon' => 'bi-calendar-event', 'error' => $errors->hasAny(['eventTitle', 'eventPrecision'])],
                      'details' => ['label' => 'Detalles adicionales', 'icon' => 'bi-card-text'],
                  ]">
    <x-ui.form-dialog-section name="basic" title="Información básica">
        <div class="d-flex flex-column gap-3">
            <x-ui.field name="eventTitle" label="Título" :required="true" wire:model="eventTitle" />
            <div class="md-field-pair">
                <x-ui.select name="eventCategory" label="Categoría" :options="\App\Models\RelationshipEvent::CATEGORIES" :selected="$eventCategory" wire:model="eventCategory" />
                <x-ui.select name="eventPrecision" label="Precisión de la fecha" :options="\App\Support\EventDate::PRECISIONS" :selected="$eventPrecision" wire:model.live="eventPrecision" />
            </div>
            @if ($eventPrecision === \App\Support\EventDate::DAY)
                <x-ui.field name="eventDate" label="Fecha" type="date" wire:model="eventDate" />
            @elseif ($eventPrecision === \App\Support\EventDate::MONTH)
                <div class="md-field-pair">
                    <x-ui.select name="eventMonth" label="Mes" :selected="$eventMonth" wire:model="eventMonth"
                                 :options="collect(['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'])->mapWithKeys(fn ($month, $index) => [$index + 1 => ucfirst($month)])->all()" />
                    <x-ui.field name="eventYear" label="Año" type="number" id="event-month-year" wire:model="eventYear" />
                </div>
            @elseif ($eventPrecision === \App\Support\EventDate::YEAR)
                <x-ui.field name="eventYear" label="Año" type="number" wire:model="eventYear" />
            @else
                <div class="md-field-pair">
                    <x-ui.field name="eventStartsOn" label="Desde" type="date" wire:model="eventStartsOn" />
                    <x-ui.field name="eventEndsOn" label="Hasta" type="date" wire:model="eventEndsOn" />
                </div>
            @endif
        </div>
    </x-ui.form-dialog-section>

    <x-ui.form-dialog-section name="details" title="Detalles adicionales">
        <div class="d-flex flex-column gap-3">
            <x-ui.textarea name="eventNotes" label="Notas" rows="4" wire:model="eventNotes" />
            <label class="md-relationship-sensitive">
                <input type="checkbox" wire:model="eventIsSensitive" id="event-sensitive">
                <span class="md-body-small">Marcar como sensible (no aparecerá en vistas globales ni resúmenes)</span>
            </label>
        </div>
    </x-ui.form-dialog-section>
</x-ui.form-dialog>
