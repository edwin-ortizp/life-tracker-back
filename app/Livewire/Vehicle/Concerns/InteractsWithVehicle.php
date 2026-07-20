<?php

namespace App\Livewire\Vehicle\Concerns;

use App\Models\MaintenanceTemplate;
use App\Models\Vehicle;

trait InteractsWithVehicle
{
    public ?string $vehicleId = null;

    protected function initializeVehicle(string $vehicle): void
    {
        $this->vehicleId = Vehicle::query()->findOrFail($vehicle)->id;
    }

    protected function vehicle(): Vehicle
    {
        return Vehicle::query()->findOrFail($this->vehicleId);
    }

    protected function visibleTemplates()
    {
        return MaintenanceTemplate::availableTo((int) auth()->id());
    }

    protected function availableTemplates(Vehicle $vehicle)
    {
        return $this->visibleTemplates()->orderBy('name')->get()->filter(function (MaintenanceTemplate $template) use ($vehicle) {
            $typeMatches = empty($template->vehicle_types) || in_array($vehicle->vehicle_type, $template->vehicle_types, true);
            $powerMatches = empty($template->power_sources) || in_array($vehicle->power_source, $template->power_sources, true);
            $transmissionMatches = empty($template->transmission_types)
                || ($vehicle->transmission_type && in_array($vehicle->transmission_type, $template->transmission_types, true));

            return $typeMatches && $powerMatches && $transmissionMatches;
        })->values();
    }

    protected function usesLiquidFuel(string $powerSource): bool
    {
        return in_array($powerSource, ['gasolina', 'diesel', 'hibrido'], true);
    }

    protected function energySources(Vehicle $vehicle): array
    {
        return match ($vehicle->power_source) {
            'gasolina' => ['gasolina'],
            'diesel' => ['diesel'],
            'electrico' => ['electrico'],
            'hibrido' => ['gasolina', 'electrico'],
            default => [],
        };
    }

    protected function energyUnitFor(Vehicle $vehicle, string $source): string
    {
        return $source === 'electrico' ? 'kWh' : ($vehicle->fuel_volume_unit ?: 'gal');
    }

    protected function energyUi(Vehicle $vehicle, ?string $editingId = null): array
    {
        return match ($vehicle->power_source) {
            'gasolina', 'diesel' => [
                'tab' => 'Combustible', 'heading' => 'Repostajes de combustible', 'action' => 'Registrar repostaje',
                'form' => $editingId ? 'Editar repostaje' : 'Registrar repostaje', 'empty' => 'Sin repostajes todavía.',
            ],
            'electrico' => [
                'tab' => 'Carga', 'heading' => 'Cargas eléctricas', 'action' => 'Registrar carga',
                'form' => $editingId ? 'Editar carga' : 'Registrar carga', 'empty' => 'Sin cargas todavía.',
            ],
            default => [
                'tab' => 'Energía', 'heading' => 'Cargas y combustible', 'action' => 'Registrar consumo',
                'form' => $editingId ? 'Editar consumo' : 'Registrar consumo', 'empty' => 'Sin registros de energía todavía.',
            ],
        };
    }
}
