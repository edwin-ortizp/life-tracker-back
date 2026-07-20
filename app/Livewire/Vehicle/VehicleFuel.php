<?php

namespace App\Livewire\Vehicle;

use App\Livewire\Vehicle\Concerns\InteractsWithVehicle;
use App\Livewire\Vehicle\Concerns\ManagesEnergyLogs;
use App\Models\VehicleEnergyLog;
use App\Support\VehicleEnergyAnalytics;
use Livewire\Attributes\Layout;
use Livewire\Component;
use Livewire\WithPagination;

#[Layout('layouts.app')]
class VehicleFuel extends Component
{
    use InteractsWithVehicle;
    use ManagesEnergyLogs;
    use WithPagination;

    public function mount(string $vehicle): void
    {
        $this->initializeVehicle($vehicle);
        abort_if(empty($this->energySources($this->vehicle())), 404);
    }

    public function render()
    {
        $vehicle = $this->vehicle();
        $energyUi = $this->energyUi($vehicle, $this->editingEnergyLogId);
        $energySources = $this->energySources($vehicle);
        $energyAnalytics = VehicleEnergyAnalytics::summaryForVehicle($vehicle);
        $energyLogs = VehicleEnergyLog::query()
            ->where('vehicle_id', $vehicle->id)
            ->orderByDesc('recorded_on')->orderByDesc('created_at')
            ->paginate(20);
        VehicleEnergyAnalytics::annotate($energyLogs->getCollection(), $vehicle);

        return view('livewire.vehicle.vehicle-fuel', compact('vehicle', 'energyUi', 'energySources', 'energyAnalytics', 'energyLogs'));
    }
}
