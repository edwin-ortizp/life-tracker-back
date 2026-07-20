<?php

namespace App\Livewire\Vehicle\Concerns;

use App\Models\VehicleMaintenanceLog;
use App\Models\VehicleMaintenancePlan;
use App\Support\VehicleUsageTimeline;

trait ManagesMaintenance
{
    public bool $showPlanForm = false;

    public bool $showMaintenanceForm = false;

    public string $templateId = '';

    public ?int $planIntervalDays = null;

    public ?float $planIntervalUsage = null;

    public string $planBaselineDate = '';

    public ?float $planBaselineUsage = null;

    public ?string $maintenancePlanId = null;

    public string $maintenanceDate = '';

    public ?float $maintenanceUsageReading = null;

    public ?float $maintenanceCost = null;

    public string $maintenanceProvider = '';

    public string $maintenanceNotes = '';

    public function openPlanForm(): void
    {
        $vehicle = $this->vehicle();
        $this->resetPlanForm();
        $this->planBaselineDate = today()->toDateString();
        $this->planBaselineUsage = $vehicle->current_usage === null ? null : (float) $vehicle->current_usage;
        $this->showPlanForm = true;
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
    }

    public function deletePlan(string $id): void
    {
        $plan = $this->vehicle()->maintenancePlans()->find($id);
        $plan?->delete();
    }

    public function openMaintenanceForm(string $planId): void
    {
        $vehicle = $this->vehicle();
        $plan = $vehicle->maintenancePlans()->find($planId);
        if (! $plan) {
            return;
        }
        $this->resetMaintenanceForm();
        $this->maintenancePlanId = $plan->id;
        $this->maintenanceDate = today()->toDateString();
        $this->maintenanceUsageReading = $vehicle->current_usage === null ? null : (float) $vehicle->current_usage;
        $this->showMaintenanceForm = true;
    }

    public function saveMaintenanceLog(): void
    {
        $vehicle = $this->vehicle();
        $plan = $this->maintenancePlanId ? $vehicle->maintenancePlans()->find($this->maintenancePlanId) : null;
        if (! $plan) {
            return;
        }
        $data = $this->validate([
            'maintenanceDate' => ['required', 'date'], 'maintenanceUsageReading' => ['nullable', 'numeric', 'min:0'],
            'maintenanceCost' => ['nullable', 'numeric', 'min:0'], 'maintenanceProvider' => ['nullable', 'string', 'max:120'],
            'maintenanceNotes' => ['nullable', 'string', 'max:1000'],
        ]);
        if ($data['maintenanceUsageReading'] !== null) {
            $conflict = VehicleUsageTimeline::conflict($vehicle, $data['maintenanceDate'], (float) $data['maintenanceUsageReading'], 'maintenance');
            if ($conflict) {
                $this->addError('maintenanceUsageReading', $conflict);

                return;
            }
        }
        VehicleMaintenanceLog::create([
            'vehicle_id' => $vehicle->id, 'vehicle_maintenance_plan_id' => $plan->id, 'performed_on' => $data['maintenanceDate'],
            'usage_reading' => $data['maintenanceUsageReading'], 'cost' => $data['maintenanceCost'],
            'provider' => $data['maintenanceProvider'] ?: null, 'notes' => $data['maintenanceNotes'] ?: null,
        ]);
        VehicleUsageTimeline::recalculateCurrentUsage($vehicle);
        $this->showMaintenanceForm = false;
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
        $this->reset('maintenancePlanId', 'maintenanceUsageReading', 'maintenanceCost', 'maintenanceProvider', 'maintenanceNotes');
        $this->maintenanceDate = '';
    }
}
