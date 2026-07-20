<?php

namespace App\Livewire\Vehicle;

use App\Livewire\Vehicle\Concerns\InteractsWithVehicle;
use App\Livewire\Vehicle\Concerns\ManagesMaintenance;
use App\Models\VehicleMaintenanceLog;
use App\Models\VehicleMaintenancePlan;
use App\Support\VehicleMaintenanceStatus;
use App\Support\VehicleUsageProjection;
use Livewire\Attributes\Layout;
use Livewire\Component;
use Livewire\WithPagination;

#[Layout('layouts.app')]
class VehicleMaintenance extends Component
{
    use InteractsWithVehicle;
    use ManagesMaintenance;
    use WithPagination;

    public function mount(string $vehicle): void
    {
        $this->initializeVehicle($vehicle);
    }

    public function render()
    {
        $vehicle = $this->vehicle();
        $plans = VehicleMaintenancePlan::query()->where('vehicle_id', $vehicle->id)->with(['template', 'vehicle', 'latestMaintenanceLog'])->get();
        $usageRate = VehicleUsageProjection::rateForVehicle($vehicle);
        $plans->each(fn (VehicleMaintenancePlan $plan) => $plan->setAttribute('status_data', VehicleMaintenanceStatus::forPlan($plan, null, $usageRate ?? false)));
        $maintenanceLogs = VehicleMaintenanceLog::query()
            ->where('vehicle_id', $vehicle->id)
            ->with('plan.template')
            ->orderByDesc('performed_on')->orderByDesc('created_at')
            ->paginate(20);
        $templates = $this->showPlanForm ? $this->availableTemplates($vehicle) : collect();
        $energyUi = $this->energyUi($vehicle);

        return view('livewire.vehicle.vehicle-maintenance', compact('vehicle', 'plans', 'maintenanceLogs', 'templates', 'energyUi'));
    }
}
