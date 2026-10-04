<?php

namespace App\Mcp\Tools\Vehicle;

use App\Mcp\Tools\Vehicle\Concerns\ResolvesVehicle;
use App\Models\VehicleMaintenanceLog;
use App\Models\VehicleMaintenancePlan;
use App\Support\VehicleUsageTimeline;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Registra un mantenimiento realizado a un vehículo (cambio de aceite, llantas, frenos…) contra uno de sus planes de mantenimiento, con fecha, odómetro, costo, taller y notas. Actualiza el kilometraje del vehículo igual que la app. Si el mantenimiento no coincide, el error lista los planes del vehículo.')]
class LogVehicleMaintenanceTool extends Tool
{
    use ResolvesVehicle;

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'vehicle_id' => ['nullable', 'string'],
            'vehicle_name' => ['nullable', 'string'],
            'maintenance' => ['required', 'string', 'max:120'],
            'date' => ['nullable', 'date'],
            'odometer' => ['nullable', 'numeric', 'min:0'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'provider' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $only = blank($data['vehicle_id'] ?? null) && blank($data['vehicle_name'] ?? null) && Auth::user()->vehicles()->count() === 1
            ? Auth::user()->vehicles()->first()
            : null;
        $vehicle = $only ?? $this->resolveVehicle($data['vehicle_id'] ?? null, $data['vehicle_name'] ?? null);
        if ($vehicle instanceof Response) {
            return $vehicle;
        }

        $plans = $vehicle->maintenancePlans()->with('template')->get();
        $term = mb_strtolower(trim($data['maintenance']));
        $name = fn (VehicleMaintenancePlan $plan) => mb_strtolower((string) $plan->template?->name);
        $matches = $plans->filter(fn ($plan) => $name($plan) === $term);
        if ($matches->isEmpty()) {
            $matches = $plans->filter(fn ($plan) => str_contains($name($plan), $term));
        }

        if ($matches->count() !== 1) {
            $available = $plans->map(fn ($plan) => $plan->template?->name)->filter()->implode(', ');

            return Response::error(($matches->isEmpty() ? "\"{$data['maintenance']}\" no está entre los mantenimientos de {$vehicle->name}." : "Hay varios mantenimientos que coinciden con \"{$data['maintenance']}\".")
                .' Planes del vehículo: '.($available ?: 'ninguno; créalos en la app').'.');
        }

        $plan = $matches->first();
        $date = $data['date'] ?? today()->toDateString();

        if (isset($data['odometer'])) {
            $conflict = VehicleUsageTimeline::conflict($vehicle, $date, (float) $data['odometer'], 'maintenance');
            if ($conflict) {
                return Response::error($conflict);
            }
        }

        VehicleMaintenanceLog::create([
            'vehicle_id' => $vehicle->id,
            'vehicle_maintenance_plan_id' => $plan->id,
            'performed_on' => $date,
            'usage_reading' => $data['odometer'] ?? null,
            'cost' => $data['cost'] ?? null,
            'provider' => filled($data['provider'] ?? null) ? trim($data['provider']) : null,
            'notes' => filled($data['notes'] ?? null) ? trim($data['notes']) : null,
        ]);
        VehicleUsageTimeline::recalculateCurrentUsage($vehicle);

        return Response::text("Mantenimiento registrado en {$vehicle->name}: {$plan->template?->name} el {$date}.");
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'vehicle_id' => $schema->string()->description('Id del vehículo. Alternativa a vehicle_name.'),
            'vehicle_name' => $schema->string()->description('Nombre del vehículo. Si solo hay uno puede omitirse.'),
            'maintenance' => $schema->string()->description('Nombre del mantenimiento según el plan del vehículo, p. ej. "Cambio de aceite".')->required(),
            'date' => $schema->string()->description('Fecha (YYYY-MM-DD). Por defecto hoy.'),
            'odometer' => $schema->number()->description('Lectura del odómetro.'),
            'cost' => $schema->number()->description('Costo pagado.'),
            'provider' => $schema->string()->description('Taller o proveedor.'),
            'notes' => $schema->string()->description('Notas.'),
        ];
    }
}
