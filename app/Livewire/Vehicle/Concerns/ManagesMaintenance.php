<?php

namespace App\Livewire\Vehicle\Concerns;

use App\Models\VehicleMaintenanceLog;
use App\Models\VehicleMaintenancePlan;
use App\Support\VehicleUsageTimeline;
use Illuminate\Validation\Rule;

trait ManagesMaintenance
{
    public bool $showPlanForm = false;

    public bool $showMaintenanceForm = false;

    public string $templateId = '';

    public ?int $planIntervalDays = null;

    public ?float $planIntervalUsage = null;

    public string $planBaselineDate = '';

    public ?float $planBaselineUsage = null;

    public ?string $editingMaintenanceLogId = null;

    public ?string $maintenancePlanId = null;

    public string $maintenanceDate = '';

    public ?float $maintenanceUsageReading = null;

    public ?float $maintenanceCost = null;

    public string $maintenanceProvider = '';

    public string $maintenanceNotes = '';

    public string $maintenanceMessage = '';

    public function openPlanForm(): void
    {
        $vehicle = $this->vehicle();
        $this->resetPlanForm();
        $this->resetValidation();
        $this->planBaselineDate = today()->toDateString();
        $this->planBaselineUsage = $vehicle->current_usage === null ? null : (float) $vehicle->current_usage;
        $this->showPlanForm = true;
    }

    public function closePlanForm(): void
    {
        $this->showPlanForm = false;
        $this->resetValidation();
    }

    public function updatedTemplateId(): void
    {
        $template = $this->visibleTemplates()->find($this->templateId);
        if ($template) {
            $this->planIntervalDays = $template->default_interval_days;
            $this->planIntervalUsage = $template->default_interval_usage === null ? null : (float) $template->default_interval_usage;
        }
    }

    public function savePlan(): void
    {
        $vehicle = $this->vehicle();
        $data = $this->validate([
            'templateId' => ['required', 'exists:maintenance_templates,id'], 'planIntervalDays' => ['nullable', 'integer', 'min:1'],
            'planIntervalUsage' => ['nullable', 'numeric', 'gt:0'], 'planBaselineDate' => ['nullable', 'date'], 'planBaselineUsage' => ['nullable', 'numeric', 'min:0'],
        ]);
        if (! $data['planIntervalDays'] && ! $data['planIntervalUsage']) {
            $this->addError('planIntervalDays', 'Indica al menos un intervalo.');

            return;
        }
        $template = $this->availableTemplates($vehicle)->firstWhere('id', $data['templateId']);
        if (! $template) {
            $this->addError('templateId', 'La plantilla no aplica a este vehículo.');

            return;
        }
        VehicleMaintenancePlan::create([
            'vehicle_id' => $vehicle->id, 'maintenance_template_id' => $template->id, 'interval_days' => $data['planIntervalDays'],
            'interval_usage' => $data['planIntervalUsage'], 'baseline_date' => $data['planBaselineDate'] ?: null, 'baseline_usage' => $data['planBaselineUsage'],
        ]);
        $this->showPlanForm = false;
        $this->maintenanceMessage = "«{$template->name}» se agregó al plan de mantenimiento.";
    }

    public function deletePlan(string $id): void
    {
        $plan = $this->vehicle()->maintenancePlans()->find($id);
        $plan?->delete();
    }

    /** Sin plan, el formulario pide elegir el mantenimiento realizado (FAB del historial de servicios). */
    public function openMaintenanceForm(?string $planId = null): void
    {
        $vehicle = $this->vehicle();
        $plan = $planId ? $vehicle->maintenancePlans()->find($planId) : null;
        if ($planId && ! $plan) {
            return;
        }
        $this->resetMaintenanceForm();
        $this->resetValidation();
        $this->maintenancePlanId = $plan?->id;
        $this->maintenanceDate = today()->toDateString();
        $this->maintenanceUsageReading = $vehicle->current_usage === null ? null : (float) $vehicle->current_usage;
        $this->showMaintenanceForm = true;
    }

    public function editMaintenanceLog(string $id): void
    {
        $log = $this->vehicle()->maintenanceLogs()->find($id);
        if (! $log) {
            return;
        }
        $this->resetMaintenanceForm();
        $this->resetValidation();
        $this->editingMaintenanceLogId = $log->id;
        $this->maintenancePlanId = $log->vehicle_maintenance_plan_id;
        $this->maintenanceDate = $log->performed_on->toDateString();
        $this->maintenanceUsageReading = $log->usage_reading === null ? null : (float) $log->usage_reading;
        $this->maintenanceCost = $log->cost === null ? null : (float) $log->cost;
        $this->maintenanceProvider = $log->provider ?? '';
        $this->maintenanceNotes = $log->notes ?? '';
        $this->showMaintenanceForm = true;
    }

    public function closeMaintenanceForm(): void
    {
        $this->showMaintenanceForm = false;
        $this->resetMaintenanceForm();
        $this->resetValidation();
    }

    public function saveMaintenanceLog(): void
    {
        $vehicle = $this->vehicle();
        $log = $this->editingMaintenanceLogId ? $vehicle->maintenanceLogs()->find($this->editingMaintenanceLogId) : null;
        if ($this->editingMaintenanceLogId && ! $log) {
            $this->closeMaintenanceForm();

            return;
        }
        $data = $this->validate([
            'maintenancePlanId' => ['required', Rule::in($vehicle->maintenancePlans()->pluck('id')->all())],
            'maintenanceDate' => ['required', 'date'], 'maintenanceUsageReading' => ['nullable', 'numeric', 'min:0'],
            'maintenanceCost' => ['nullable', 'numeric', 'min:0'], 'maintenanceProvider' => ['nullable', 'string', 'max:120'],
            'maintenanceNotes' => ['nullable', 'string', 'max:1000'],
        ], [
            'maintenancePlanId.required' => 'Elige el mantenimiento que se realizó.',
            'maintenancePlanId.in' => 'Ese mantenimiento no pertenece al plan de este vehículo.',
        ]);
        if ($data['maintenanceUsageReading'] !== null) {
            $conflict = VehicleUsageTimeline::conflict($vehicle, $data['maintenanceDate'], (float) $data['maintenanceUsageReading'], 'maintenance', $log?->id, $log?->created_at);
            if ($conflict) {
                $this->addError('maintenanceUsageReading', $conflict);

                return;
            }
        }
        $attributes = [
            'vehicle_id' => $vehicle->id, 'vehicle_maintenance_plan_id' => $data['maintenancePlanId'], 'performed_on' => $data['maintenanceDate'],
            'usage_reading' => $data['maintenanceUsageReading'], 'cost' => $data['maintenanceCost'],
            'provider' => $data['maintenanceProvider'] ?: null, 'notes' => $data['maintenanceNotes'] ?: null,
        ];
        $log ? $log->update($attributes) : VehicleMaintenanceLog::create($attributes);
        VehicleUsageTimeline::recalculateCurrentUsage($vehicle);
        $this->maintenanceMessage = $log ? 'Servicio actualizado.' : 'Servicio registrado en el historial de servicios.';
        $this->closeMaintenanceForm();
        $this->resetPage();
    }

    public function deleteMaintenanceLog(string $id): void
    {
        $vehicle = $this->vehicle();
        $log = $vehicle->maintenanceLogs()->find($id);
        if (! $log) {
            return;
        }
        $log->delete();
        VehicleUsageTimeline::recalculateCurrentUsage($vehicle);
        $this->resetPage();
    }

    private function resetPlanForm(): void
    {
        $this->reset('templateId', 'planIntervalDays', 'planIntervalUsage', 'planBaselineUsage');
        $this->planBaselineDate = '';
    }

    private function resetMaintenanceForm(): void
    {
        $this->reset('editingMaintenanceLogId', 'maintenancePlanId', 'maintenanceUsageReading', 'maintenanceCost', 'maintenanceProvider', 'maintenanceNotes');
        $this->maintenanceDate = '';
    }
}
