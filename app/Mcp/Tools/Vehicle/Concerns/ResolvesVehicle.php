<?php

namespace App\Mcp\Tools\Vehicle\Concerns;

use App\Models\Vehicle;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Response;

trait ResolvesVehicle
{
    /**
     * @return Vehicle|Response Returns a Response::error(...) when the vehicle
     *                          cannot be uniquely identified.
     */
    protected function resolveVehicle(?string $vehicleId, ?string $vehicleName): Vehicle|Response
    {
        if ($vehicleId) {
            $vehicle = Auth::user()->vehicles()->find($vehicleId);

            return $vehicle ?? Response::error('No se encontró el vehículo o no te pertenece.');
        }

        if (! $vehicleName) {
            return Response::error('Debes indicar vehicle_id o vehicle_name para identificar el vehículo.');
        }

        $term = trim((string) preg_replace('/^(el|la|los|las)\s+/iu', '', trim($vehicleName)));
        $matches = Auth::user()->vehicles()->where('name', 'like', "%{$term}%")->get();

        if ($matches->isEmpty() && $term !== trim($vehicleName)) {
            $matches = Auth::user()->vehicles()->where('name', 'like', '%'.trim($vehicleName).'%')->get();
        }

        if ($matches->isEmpty()) {
            return Response::error("No encontré ningún vehículo que coincida con \"{$vehicleName}\". Usa list_vehicles para revisar tus vehículos.");
        }

        if ($matches->count() > 1) {
            $list = $matches->map(fn (Vehicle $vehicle) => "{$vehicle->name} (id: {$vehicle->id})")->implode(', ');

            return Response::error("Hay varios vehículos que coinciden con \"{$vehicleName}\": {$list}. Especifica el vehicle_id o un nombre más preciso.");
        }

        return $matches->first();
    }

    /**
     * Mirrors App\Livewire\Vehicle\Concerns\InteractsWithVehicle::energySources() — keep in sync.
     *
     * @return array<int, string>
     */
    protected function energySourcesFor(Vehicle $vehicle): array
    {
        return match ($vehicle->power_source) {
            'gasolina' => ['gasolina'],
            'diesel' => ['diesel'],
            'electrico' => ['electrico'],
            'hibrido' => ['gasolina', 'electrico'],
            default => [],
        };
    }

    /** Mirrors App\Livewire\Vehicle\Concerns\InteractsWithVehicle::energyUnitFor() — keep in sync. */
    protected function energyUnitFor(Vehicle $vehicle, string $source): string
    {
        return $source === 'electrico' ? 'kWh' : ($vehicle->fuel_volume_unit ?: 'gal');
    }
}
