@isset($templates)
    <x-ui.form-dialog :open="$showPlanForm" close="closePlanForm" submit-action="savePlan" id="vehicle-plan-dialog"
                      title="Activar mantenimiento" icon="bi-calendar2-check" submit="Activar plan">
        <div class="d-flex flex-column gap-3">
            <x-ui.select name="templateId" label="Mantenimiento" placeholder="Selecciona un mantenimiento" :required="true"
                         :options="$templates->mapWithKeys(fn ($template) => [$template->id => $template->name])->all()"
                         :selected="$templateId" wire:model.live="templateId" />
            <div class="md-field-pair">
                <x-ui.field name="planIntervalDays" label="Cada cuántos días" type="number" min="1" wire:model="planIntervalDays" />
                <x-ui.field name="planIntervalUsage" :label="'Cada cuántos '.($vehicle->usage_unit ?: 'de uso')" type="number" min="1" step=".01" wire:model="planIntervalUsage" />
            </div>
            <div class="md-field-pair">
                <x-ui.field name="planBaselineDate" label="Último servicio" type="date" wire:model="planBaselineDate" />
                <x-ui.field name="planBaselineUsage" label="Lectura al servicio" type="number" min="0" step=".01" wire:model="planBaselineUsage" />
            </div>
            <p class="md-body-small mb-0">Los intervalos parten de la recomendación del catálogo; ajústalos si el manual de tu vehículo indica otros.</p>
        </div>
    </x-ui.form-dialog>
@endisset

<x-ui.form-dialog :open="$showMaintenanceForm" close="closeMaintenanceForm" submit-action="saveMaintenanceLog" id="vehicle-service-dialog"
                  :title="$editingMaintenanceLogId ? 'Editar servicio' : 'Registrar servicio'" icon="bi-wrench-adjustable"
                  :submit="$editingMaintenanceLogId ? 'Guardar cambios' : 'Guardar servicio'">
    <div class="d-flex flex-column gap-3">
        <x-ui.select name="maintenancePlanId" label="Mantenimiento realizado" placeholder="Selecciona el mantenimiento" :required="true"
                     :options="$planOptions" :selected="$maintenancePlanId" icon="bi-tools" wire:model="maintenancePlanId" />
        <div class="md-field-pair">
            <x-ui.field name="maintenanceDate" label="Fecha" type="date" :required="true" wire:model="maintenanceDate" />
            <x-ui.field name="maintenanceUsageReading" :label="'Lectura ('.($vehicle->usage_unit ?: 'uso').')'" type="number" min="0" step=".01" icon="bi-speedometer2" wire:model="maintenanceUsageReading" />
        </div>
        <div class="md-field-pair">
            <x-ui.field name="maintenanceCost" label="Costo" type="number" min="0" step=".01" icon="bi-cash" wire:model="maintenanceCost" />
            <x-ui.field name="maintenanceProvider" label="Taller o proveedor" maxlength="120" icon="bi-shop" wire:model="maintenanceProvider" />
        </div>
        <x-ui.textarea name="maintenanceNotes" label="Notas" rows="3" wire:model="maintenanceNotes" />
    </div>
</x-ui.form-dialog>
