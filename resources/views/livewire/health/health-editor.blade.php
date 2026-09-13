<div x-data="ltFormEditor($wire, @js($defaults), {openForm:'showForm', openTaskForm:'showTaskForm', openLogForm:'showLogForm', editLog:'showLogForm', openRecoveryForm:'showRecoveryForm', openRescheduleTask:'showRescheduleForm'})"
     @health-editor.window="openEditor($event.detail)">
    @php
        $basicErrors = $errors->hasAny(['type', 'title', 'eventDate', 'bodyAreas', 'bodyAreas.*', 'customBodyArea', 'initialIntensity', 'illness', 'customIllness']);
        $detailErrors = $errors->hasAny(['endDate', 'notes', 'provider', 'specialty', 'vaccineName', 'vaccineDose']);
        $tracksForm = in_array($type, \App\Models\HealthEvent::EVOLUTION_TYPES, true);
        $zonesForm = in_array($type, \App\Models\HealthEvent::BODY_AREA_TYPES, true);
        $careForm = in_array($type, \App\Models\HealthEvent::SCHEDULED_TYPES, true);
    @endphp

    <x-ui.form-dialog validation-state="submitted" module="health" state="$wire.showForm" close="closeForm" submit-action="save" id="health-event-dialog" title-expression="$wire.editingId ? 'Editar evento de salud' : 'Registrar evento de salud'"
                      :title="$editingId ? 'Editar evento de salud' : 'Registrar evento de salud'" icon="bi-heart-pulse"
                      :sections="[
                          'basic' => ['label' => 'Información básica', 'icon' => 'bi-file-earmark-text', 'error' => $basicErrors],
                          'details' => ['label' => 'Detalles adicionales', 'icon' => 'bi-card-text', 'error' => $detailErrors],
                          'summary' => ['label' => 'Resumen', 'icon' => 'bi-check2-circle'],
                      ]">
        <x-ui.form-dialog-section name="basic" title="Información básica" description="Registra los datos principales de tu evento de salud.">
            <div class="md-form-dialog__grid">
                <x-ui.select name="type" label="Tipo de evento" :options="$typeLabels" :selected="$type" icon="bi-lightning" :required="true" wire:model="type" />

                <div class="lt-field-condition" x-show="$wire.type === 'symptom'">
                    <x-ui.field id="health-date-symptom" name="eventDate" type="date" label="Fecha" :required="true" wire:model="eventDate" />
                </div>
                <div class="lt-field-condition" x-show="!($wire.type === 'symptom') && ($wire.type === 'illness')">
                    <x-ui.select name="illness" label="Enfermedad" :options="$commonIllnesses" :selected="$illness" placeholder="Selecciona una enfermedad" icon="bi-thermometer-half" :required="true" wire:model="illness" />
                </div>
                <div class="lt-field-condition" x-show="!($wire.type === 'symptom' || ($wire.type === 'illness')) && (['appointment','checkup','procedure'].includes($wire.type))">
                    <x-ui.field label-expression="$wire.type === 'procedure' ? 'Profesional o cirujano' : 'Profesional'" name="provider" :label="$type === 'procedure' ? 'Profesional o cirujano' : 'Profesional'" icon="bi-person-badge" wire:model="provider" />
                </div>
                <div class="lt-field-condition" x-show="!($wire.type === 'symptom' || ($wire.type === 'illness') || (['appointment','checkup','procedure'].includes($wire.type))) && ($wire.type === 'vaccination')">
                    <x-ui.field name="vaccineName" label="Vacuna" icon="bi-shield-plus" wire:model="vaccineName" />
                </div><div class="lt-field-condition" x-show="!($wire.type === 'symptom' || ($wire.type === 'illness') || (['appointment','checkup','procedure'].includes($wire.type)) || ($wire.type === 'vaccination'))">
                    <x-ui.field id="health-end-basic" name="endDate" type="date" label="Hasta (opcional)" wire:model="endDate" />
                </div>

                <div class="md-form-dialog__full">
                    <x-ui.field name="title" label="Título" :required="true" wire:model="title" />
                </div>

                <div class="lt-field-condition" x-show="$wire.type !== 'symptom'">
                    <x-ui.field name="eventDate" type="date" label="Fecha" :required="true" wire:model="eventDate" />
                </div>

                <div class="lt-field-condition" x-show="['symptom','illness','procedure'].includes($wire.type) && ! $wire.editingId">
                    <x-ui.select label-expression="$wire.type === 'procedure' ? 'Molestia inicial (opcional)' : 'Intensidad (1–10) *'" name="initialIntensity" :label="$type === 'procedure' ? 'Molestia inicial (opcional)' : 'Intensidad (1–10)'" :options="$intensityOptions" :selected="$initialIntensity" placeholder="Selecciona…" icon="bi-bar-chart" :required="$type !== 'procedure'" x-bind:required="$wire.type !== 'procedure'" wire:model="initialIntensity" />
                </div>
                <div class="lt-field-condition" x-show="!(['symptom','illness','procedure'].includes($wire.type) && ! $wire.editingId) && (['appointment','checkup'].includes($wire.type))">
                    <x-ui.field name="specialty" label="Especialidad" icon="bi-heart-pulse" wire:model="specialty" />
                </div>
                <div class="lt-field-condition" x-show="!(['symptom','illness','procedure'].includes($wire.type) && ! $wire.editingId || (['appointment','checkup'].includes($wire.type))) && ($wire.type === 'vaccination')">
                    <x-ui.field name="vaccineDose" label="Dosis" wire:model="vaccineDose" />
                </div>

                <div class="lt-field-condition" x-show="['appointment','checkup','procedure'].includes($wire.type)">
                    <x-ui.field name="facility" label="Centro o clínica" icon="bi-building" wire:model="facility" />
                </div>

                <div class="lt-field-condition" x-show="['symptom','illness','procedure'].includes($wire.type)">
                    <div class="md-form-dialog__full">
                        <x-ui.multi-select :live="false" label-expression="$wire.type === 'symptom' ? 'Zonas del cuerpo *' : 'Zonas del cuerpo (opcional)'" name="bodyAreas" :label="$type === 'symptom' ? 'Zonas del cuerpo *' : 'Zonas del cuerpo (opcional)'"
                                           :options="$bodyAreaOptions" :all-label="$type === 'symptom' ? 'Selecciona una o varias zonas' : 'Sin zonas relacionadas'" icon="bi-person" />
                    </div>
                </div>

                <div class="lt-field-condition" x-show="['symptom','illness','procedure'].includes($wire.type) && $wire.bodyAreas.includes('other')">
                    <div class="md-form-dialog__full"><x-ui.field name="customBodyArea" label="Describe la zona" :required="true" wire:model="customBodyArea" /></div>
                </div>
                <div class="lt-field-condition" x-show="$wire.type === 'illness' && $wire.illness === 'other'">
                    <div class="md-form-dialog__full"><x-ui.field name="customIllness" label="¿Cuál enfermedad?" :required="true" wire:model="customIllness" /></div>
                </div>
            </div>
        </x-ui.form-dialog-section>

        <x-ui.form-dialog-section name="details" title="Detalles adicionales" description="Contexto que ayuda a entender el evento y su evolución.">
            <div class="md-form-dialog__grid">
                <div class="md-form-dialog__full">
                    <x-ui.textarea name="notes" label="Notas" rows="5" wire:model="notes" />
                </div>
                <div class="lt-field-condition" x-show="['appointment','checkup','vaccination'].includes($wire.type)">
                    <x-ui.field name="endDate" type="date" label="Hasta (opcional)" wire:model="endDate" />
                </div>
            </div>
                <div class="lt-field-condition" x-show="['appointment','checkup','procedure'].includes($wire.type)">
                <p class="md-form-dialog__hint"><i class="bi bi-calendar-plus" aria-hidden="true"></i> Si la fecha es futura, se creará y enlazará automáticamente una tarea en tu agenda.</p>
                </div>
        </x-ui.form-dialog-section>

        <x-ui.form-dialog-section name="summary" title="Resumen" description="Revisa la información antes de guardar.">
            <dl class="md-form-dialog__summary">
                <div><dt>Tipo</dt><dd x-text="(@js($typeLabels))[$wire.type] ?? '—'"></dd></div>
                <div><dt>Título</dt><dd x-text="$wire.title || '—'"></dd></div>
                <div><dt>Fecha</dt><dd x-text="$wire.eventDate || '—'"></dd></div>
                <div x-show="['symptom','illness','procedure'].includes($wire.type)"><dt>Zonas del cuerpo</dt><dd x-text="$wire.bodyAreas.map(area => area === 'other' ? $wire.customBodyArea : (@js(\App\Models\HealthEvent::BODY_AREAS))[area]).join(', ') || '—'"></dd></div>
                <div x-show="$wire.type === 'illness'"><dt>Enfermedad</dt><dd x-text="$wire.illness === 'other' ? $wire.customIllness : ((@js($commonIllnesses))[$wire.illness] || '—')"></dd></div>
                <div x-show="['symptom','illness','procedure'].includes($wire.type) && !$wire.editingId"><dt>Intensidad</dt><dd x-text="$wire.initialIntensity ? $wire.initialIntensity + '/10' : '—'"></dd></div>
                <div><dt>Notas</dt><dd x-text="$wire.notes || '—'"></dd></div>
            </dl>
        </x-ui.form-dialog-section>
    </x-ui.form-dialog>

    <x-ui.form-dialog validation-state="submitted" module="health" state="$wire.showLogForm" close="closeLogForm" :submit-action="$editingLogId ? 'updateLog' : 'saveLog'" id="health-log-dialog" title-expression="$wire.editingLogId ? 'Editar día' : 'Registrar cómo te sentiste'"
                      :title="$editingLogId ? 'Editar día' : 'Registrar cómo te sentiste'" icon="bi-activity">
        <div class="md-form-dialog__grid">
            <x-ui.field name="logDate" type="date" label="Fecha" :required="true" :readonly="(bool) $editingLogId" wire:model="logDate" />
            <x-ui.select name="logIntensity" label="Intensidad (1–10)" :options="$intensityOptions" :selected="$logIntensity" placeholder="Selecciona…" icon="bi-bar-chart" :required="true" wire:model="logIntensity" />
            <div class="md-form-dialog__full">
                <x-ui.textarea name="logNotes" label="Nota (opcional)" rows="3" wire:model="logNotes" />
            </div>
        </div>
    </x-ui.form-dialog>

    <x-ui.form-dialog validation-state="submitted" module="health" state="$wire.showRecoveryForm" close="closeRecoveryForm" submit-action="saveRecovery" id="health-recovery-dialog"
                      title="Marcar recuperación" icon="bi-check2-circle">
        <div class="md-form-dialog__grid">
            <x-ui.field name="recoveryDate" type="date" label="Día de recuperación" :required="true" wire:model.live="recoveryDate" />
            <x-ui.select name="recoveryIntensity" label="Intensidad ese día (1–10)" :options="$intensityOptions" :selected="$recoveryIntensity" placeholder="Selecciona…" icon="bi-bar-chart" wire:model="recoveryIntensity" />
        </div>
        <p class="md-form-dialog__hint"><i class="bi bi-info-circle" aria-hidden="true"></i> Si ya registraste este día, se conserva su intensidad.</p>
    </x-ui.form-dialog>

    <x-ui.form-dialog validation-state="submitted" module="health" state="$wire.showTaskForm" close="closeTaskForm" submit-action="savePendingTask" id="health-task-dialog"
                      title="Nuevo pendiente de salud" icon="bi-list-check">
        <div class="md-form-dialog__grid">
            <div class="md-form-dialog__full">
                <x-ui.field name="pendingTitle" label="¿Qué necesitas hacer?" :required="true" wire:model="pendingTitle" />
            </div>
            <x-ui.field name="pendingDate" type="date" label="Fecha prevista" wire:model="pendingDate" />
        </div>
        <p class="md-form-dialog__hint"><i class="bi bi-info-circle" aria-hidden="true"></i> Se crea como tarea de Salud; úsala para pedir una cita o investigar una vacuna.</p>
    </x-ui.form-dialog>

    <x-ui.form-dialog validation-state="submitted" module="health" state="$wire.showRescheduleForm" close="closeRescheduleForm" submit-action="saveRescheduleTask" id="health-reschedule-dialog"
                      title="Reprogramar pendiente" icon="bi-calendar-event">
        <div class="md-form-dialog__grid">
            <x-ui.field name="rescheduleDate" type="date" label="Nueva fecha" :required="true" wire:model="rescheduleDate" />
        </div>
    </x-ui.form-dialog>
</div>
