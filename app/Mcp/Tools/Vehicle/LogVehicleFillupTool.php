<?php

namespace App\Mcp\Tools\Vehicle;

use App\Mcp\Tools\Vehicle\Concerns\ResolvesVehicle;
use App\Support\VehicleEnergyAnalytics;
use App\Support\VehicleUsageTimeline;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Registra un repostaje o carga de energía para un vehículo del usuario autenticado. Dados dos de: cantidad, precio unitario o costo total, calcula el tercero, y reporta el rendimiento más reciente.')]
class LogVehicleFillupTool extends Tool
{
    use ResolvesVehicle;

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'vehicle_id' => ['nullable', 'string'],
            'vehicle_name' => ['nullable', 'string'],
            'date' => ['nullable', 'date'],
            'energy_source' => ['nullable', 'string', Rule::in(['gasolina', 'diesel', 'electrico'])],
            'quantity' => ['nullable', 'numeric', 'gt:0'],
            'unit_price' => ['nullable', 'numeric', 'gt:0'],
            'cost' => ['nullable', 'numeric', 'gt:0'],
            'is_full' => ['nullable', 'boolean'],
            'odometer' => ['nullable', 'numeric', 'min:0'],
            'provider' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $vehicle = $this->resolveVehicle($data['vehicle_id'] ?? null, $data['vehicle_name'] ?? null);
        if ($vehicle instanceof Response) {
            return $vehicle;
        }

        $sources = $this->energySourcesFor($vehicle);
        $source = $data['energy_source'] ?? ($sources[0] ?? null);
        if ($source === null || ! in_array($source, $sources, true)) {
            return Response::error('Este vehículo no admite ese tipo de energía.');
        }
        $unit = $this->energyUnitFor($vehicle, $source);

        $solved = $this->solvePricing($data['quantity'] ?? null, $data['unit_price'] ?? null, $data['cost'] ?? null);
        if ($solved instanceof Response) {
            return $solved;
        }
        [$quantity, $unitPrice, $cost] = $solved;

        $date = $data['date'] ?? today()->toDateString();

        if (isset($data['odometer'])) {
            $conflict = VehicleUsageTimeline::conflict($vehicle, $date, (float) $data['odometer'], 'energy');
            if ($conflict) {
                return Response::error($conflict);
            }
        }

        $vehicle->energyLogs()->create([
            'recorded_on' => $date,
            'energy_source' => $source,
            'quantity' => $quantity,
            'unit' => $unit,
            'is_full' => $data['is_full'] ?? false,
            'cost' => $cost,
            'usage_reading' => $data['odometer'] ?? null,
            'provider' => $data['provider'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        VehicleUsageTimeline::recalculateCurrentUsage($vehicle);

        $message = "Repostaje registrado para \"{$vehicle->name}\": {$quantity} {$unit} por \${$cost} (\${$unitPrice}/{$unit}).";

        $efficiency = VehicleEnergyAnalytics::forVehicle($vehicle)['latest_efficiency'];
        if ($efficiency) {
            $rounded = round($efficiency['efficiency'], 2);
            $message .= " Rendimiento más reciente: {$efficiency['distance']} {$vehicle->usage_unit} con {$efficiency['fuel']} {$unit} → {$rounded} {$vehicle->usage_unit}/{$unit}.";
        } else {
            $message .= ' Aún no hay suficientes repostajes completos para calcular el rendimiento (se necesitan al menos dos repostajes marcados como llenos).';
        }

        return Response::text($message);
    }

    /**
     * @return array{0: float, 1: float, 2: float}|Response
     */
    private function solvePricing(?float $quantity, ?float $unitPrice, ?float $cost): array|Response
    {
        $known = array_filter(['quantity' => $quantity, 'unit_price' => $unitPrice, 'cost' => $cost], fn ($value) => $value !== null);

        if (count($known) < 2) {
            return Response::error('Indica al menos dos de: quantity, unit_price o cost, para calcular el tercero.');
        }

        if ($quantity === null) {
            $quantity = round($cost / $unitPrice, 2);
        } elseif ($cost === null) {
            $cost = round($quantity * $unitPrice, 2);
        } elseif ($unitPrice === null) {
            $unitPrice = round($cost / $quantity, 2);
        }

        if ($quantity <= 0) {
            return Response::error('La cantidad calculada debe ser mayor que cero.');
        }

        return [$quantity, $unitPrice, $cost];
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'vehicle_id' => $schema->string()
                ->description('Identificador (UUID) del vehículo. Alternativa a "vehicle_name".'),
            'vehicle_name' => $schema->string()
                ->description('Nombre del vehículo, p. ej. "el Cruz". Alternativa a "vehicle_id".'),
            'date' => $schema->string()
                ->description('Fecha del repostaje en formato YYYY-MM-DD. Por defecto hoy.'),
            'energy_source' => $schema->string()
                ->enum(['gasolina', 'diesel', 'electrico'])
                ->description('Tipo de energía. Se infiere si el vehículo solo admite una.'),
            'quantity' => $schema->number()
                ->description('Cantidad repostada (galones, litros o kWh). Indica al menos dos de quantity/unit_price/cost.'),
            'unit_price' => $schema->number()
                ->description('Precio por unidad (por galón, litro o kWh).'),
            'cost' => $schema->number()
                ->description('Costo total pagado.'),
            'is_full' => $schema->boolean()
                ->description('Marca true cuando el usuario llenó el tanque por completo. El rendimiento solo se calcula entre repostajes marcados como llenos.'),
            'odometer' => $schema->number()
                ->description('Lectura del odómetro en el momento del repostaje.'),
            'provider' => $schema->string()
                ->description('Estación o proveedor.'),
            'notes' => $schema->string()
                ->description('Notas adicionales.'),
        ];
    }
}
