<?php

namespace App\Livewire\Vehicle;

use App\Livewire\Vehicle\Concerns\InteractsWithVehicle;
use App\Livewire\Vehicle\Concerns\ManagesVehicleForm;
use App\Models\Vehicle;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Vehículos')]
class VehicleIndex extends Component
{
    use InteractsWithVehicle;
    use ManagesVehicleForm;

    protected function vehicleSaved(Vehicle $vehicle): void
    {
        $this->redirectRoute('vehicles.show', ['vehicle' => $vehicle->id]);
    }

    public function render()
    {
        return view('livewire.vehicle.vehicle-index', [
            'vehicles' => Vehicle::query()->orderBy('name')->get(),
        ]);
    }
}
