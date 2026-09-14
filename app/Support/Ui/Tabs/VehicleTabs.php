<?php

namespace App\Support\Ui\Tabs;

use App\Models\Vehicle;

/**
 * Pestañas del detalle de un vehículo. Conservan la recarga completa (sin wire:navigate)
 * porque las vistas del vehículo inicializan gráficos al cargar.
 */
final class VehicleTabs
{
    /**
     * @param  array<string, string>  $energyUi
     * @return list<array<string, mixed>>
     */
    public static function for(Vehicle $vehicle, array $energyUi = []): array
    {
        $params = ['vehicle' => $vehicle];

        return array_values(array_filter([
            ['label' => 'Resumen', 'route' => 'vehicles.show', 'params' => $params, 'icon' => 'bi-speedometer2', 'active' => ['vehicles.show'], 'navigate' => false],
            in_array($vehicle->power_source, ['humana', 'ninguna'], true)
                ? null
                : ['label' => $energyUi['tab'] ?? 'Energía', 'route' => 'vehicles.fuel', 'params' => $params, 'icon' => 'bi-fuel-pump', 'active' => ['vehicles.fuel'], 'navigate' => false],
            ['label' => 'Mantenimiento', 'route' => 'vehicles.maintenance', 'params' => $params, 'icon' => 'bi-tools', 'active' => ['vehicles.maintenance'], 'navigate' => false],
            ['label' => 'Servicios', 'route' => 'vehicles.services', 'params' => $params, 'icon' => 'bi-clock-history', 'active' => ['vehicles.services'], 'navigate' => false],
            ['label' => 'Gastos', 'route' => 'vehicles.expenses', 'params' => $params, 'icon' => 'bi-wallet2', 'active' => ['vehicles.expenses'], 'navigate' => false],
        ]));
    }

    /**
     * @return array{href: string, label: string, navigate: bool}
     */
    public static function back(): array
    {
        return ['href' => route('vehicles'), 'label' => 'Volver al garaje', 'navigate' => false];
    }
}
