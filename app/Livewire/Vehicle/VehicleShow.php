<?php

namespace App\Livewire\Vehicle;

use App\Livewire\Vehicle\Concerns\InteractsWithVehicle;
use App\Livewire\Vehicle\Concerns\ManagesVehicleForm;
use App\Models\VehicleMaintenancePlan;
use App\Support\VehicleMaintenanceStatus;
use App\Support\VehicleUsageProjection;
use Livewire\Attributes\Layout;
use Livewire\Component;

#[Layout('layouts.app')]
class VehicleShow extends Component
{
    use InteractsWithVehicle;
    use ManagesVehicleForm;

    public function mount(string $vehicle): void
    {
        $this->initializeVehicle($vehicle);
    }

    protected function vehicleDeleted(): void
    {
        $this->redirectRoute('vehicles');
    }

    public function editVehicle(): void
    {
        $this->openVehicleForm($this->vehicleId);
    }

    public function render()
    {
        $vehicle = $this->vehicle();
        $plans = VehicleMaintenancePlan::query()
            ->where('vehicle_id', $vehicle->id)
            ->with(['template', 'vehicle', 'latestMaintenanceLog'])
            ->get();
        $usageRate = VehicleUsageProjection::rateForVehicle($vehicle);
        $plans->each(fn (VehicleMaintenancePlan $plan) => $plan->setAttribute('status_data', VehicleMaintenanceStatus::forPlan($plan, null, $usageRate ?? false)));
        $energyUi = $this->energyUi($vehicle);

        return view('livewire.vehicle.vehicle-show', compact('vehicle', 'plans', 'energyUi'));
    }
}
