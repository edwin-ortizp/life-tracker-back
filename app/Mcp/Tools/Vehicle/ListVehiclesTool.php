<?php

namespace App\Mcp\Tools\Vehicle;

use App\Support\VehicleEnergyAnalytics;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Lista los vehículos del usuario autenticado con su estado y rendimiento reciente.')]
class ListVehiclesTool extends Tool
{
    public function handle(Request $request): ResponseFactory
    {
        $data = $request->validate([
            'name' => ['nullable', 'string'],
        ]);

        $query = Auth::user()->vehicles();

        if (! empty($data['name'])) {
            $term = trim((string) preg_replace('/^(el|la|los|las)\s+/iu', '', trim($data['name'])));
            $query->where('name', 'like', '%'.($term ?: $data['name']).'%');
        }

        $vehicles = $query->orderBy('name')->get();

        return Response::structured([
            'vehicles' => $vehicles->map(function ($vehicle) {
                $summary = VehicleEnergyAnalytics::summaryForVehicle($vehicle);
                $efficiency = $summary['latest_efficiency']
                    ? ['distance' => $summary['latest_efficiency']['distance'], 'fuel' => $summary['latest_efficiency']['fuel'], 'efficiency' => round($summary['latest_efficiency']['efficiency'], 2)]
                    : null;

                return [
                    'id' => $vehicle->id,
                    'name' => $vehicle->name,
                    'vehicle_type' => $vehicle->vehicle_type,
                    'power_source' => $vehicle->power_source,
                    'fuel_volume_unit' => $vehicle->fuel_volume_unit,
                    'usage_unit' => $vehicle->usage_unit,
                    'current_usage' => $vehicle->current_usage,
                    'tank_capacity' => $vehicle->tank_capacity,
                    'unit' => $summary['unit'],
                    'latest_price' => $summary['latest_price'],
                    'weighted_average_price' => $summary['weighted_average_price'],
                    'latest_efficiency' => $efficiency,
                ];
            })->all(),
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'name' => $schema->string()
                ->description('Filtra por nombre del vehículo, p. ej. "el Cruz".'),
        ];
    }
}
