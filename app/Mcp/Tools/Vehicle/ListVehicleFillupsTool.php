<?php

namespace App\Mcp\Tools\Vehicle;

use App\Mcp\Support\McpOutput;
use App\Mcp\Tools\Vehicle\Concerns\ResolvesVehicle;
use App\Models\VehicleEnergyLog;
use App\Models\VehicleExpense;
use App\Models\VehicleMaintenanceLog;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Historial de un vehículo: repostajes (fecha, cantidad, costo, precio por unidad, odómetro, estación) y, si se piden, mantenimientos y otros gastos (seguro, peajes, repuestos…). Úsala para preguntas de gasto en combustible o del carro, precio, cada cuánto tanquea, kilometraje o cuándo fue el último mantenimiento.')]
class ListVehicleFillupsTool extends Tool
{
    use ResolvesVehicle;

    public function handle(Request $request): Response|ResponseFactory
    {
        $data = $request->validate([
            'vehicle_id' => ['nullable', 'string'],
            'vehicle_name' => ['nullable', 'string'],
            'since' => ['nullable', 'date'],
            'include_maintenance' => ['nullable', 'boolean'],
            'include_expenses' => ['nullable', 'boolean'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        // Con un solo vehículo no hace falta nombrarlo.
        $only = blank($data['vehicle_id'] ?? null) && blank($data['vehicle_name'] ?? null) && Auth::user()->vehicles()->count() === 1
            ? Auth::user()->vehicles()->first()
            : null;
        $vehicle = $only ?? $this->resolveVehicle($data['vehicle_id'] ?? null, $data['vehicle_name'] ?? null);
        if ($vehicle instanceof Response) {
            return $vehicle;
        }

        $fillups = $vehicle->energyLogs()
            ->when(filled($data['since'] ?? null), fn ($query) => $query->whereDate('recorded_on', '>=', $data['since']))
            ->orderByDesc('recorded_on')
            ->orderByDesc('created_at')
            ->limit($data['limit'] ?? 20)
            ->get();

        $maintenance = empty($data['include_maintenance']) ? null : $vehicle->maintenanceLogs()
            ->with('plan.template')
            ->when(filled($data['since'] ?? null), fn ($query) => $query->whereDate('performed_on', '>=', $data['since']))
            ->orderByDesc('performed_on')
            ->limit($data['limit'] ?? 20)
            ->get()
            ->map(fn (VehicleMaintenanceLog $log) => [
                'performed_on' => $log->performed_on->toDateString(),
                'maintenance' => $log->plan?->template?->name,
                'usage_reading' => $log->usage_reading !== null ? (float) $log->usage_reading : null,
                'cost' => $log->cost !== null ? (float) $log->cost : null,
                'provider' => $log->provider,
                'notes' => $log->notes,
            ])->all();

        $expenses = empty($data['include_expenses']) ? null : $vehicle->expenses()
            ->with('category')
            ->when(filled($data['since'] ?? null), fn ($query) => $query->whereDate('spent_on', '>=', $data['since']))
            ->orderByDesc('spent_on')
            ->limit($data['limit'] ?? 20)
            ->get();

        return Response::structured(McpOutput::compact([
            'vehicle' => ['id' => $vehicle->id, 'name' => $vehicle->name],
            'summary' => [
                'fillups' => $fillups->count(),
                'total_cost' => round((float) $fillups->sum('cost'), 2) ?: null,
                'total_quantity' => round((float) $fillups->sum('quantity'), 2) ?: null,
            ],
            'fillups' => $fillups->map(fn (VehicleEnergyLog $log) => [
                'recorded_on' => $log->recorded_on->toDateString(),
                'energy_source' => $log->energy_source,
                'quantity' => $log->quantity !== null ? (float) $log->quantity : null,
                'unit' => $log->unit,
                'cost' => $log->cost !== null ? (float) $log->cost : null,
                'unit_price' => $log->cost && $log->quantity > 0 ? round((float) $log->cost / (float) $log->quantity, 2) : null,
                'is_full' => (bool) $log->is_full,
                'odometer' => $log->usage_reading !== null ? (float) $log->usage_reading : null,
                'provider' => $log->provider,
                'notes' => $log->notes,
            ])->all(),
            'maintenance' => $maintenance,
            'expenses' => $expenses?->map(fn (VehicleExpense $expense) => McpOutput::compact([
                'spent_on' => $expense->spent_on->toDateString(),
                'category' => $expense->category?->name,
                'amount' => (float) $expense->amount,
                'description' => $expense->description,
                'provider' => $expense->provider,
            ]))->all(),
            'expenses_total' => $expenses ? round((float) $expenses->sum('amount'), 2) : null,
        ]));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'vehicle_id' => $schema->string()->description('Id del vehículo. Alternativa a "vehicle_name".'),
            'vehicle_name' => $schema->string()->description('Nombre del vehículo, p. ej. "el Cruze". Si solo hay uno puede omitirse.'),
            'since' => $schema->string()->description('Desde esta fecha (YYYY-MM-DD).'),
            'include_maintenance' => $schema->boolean()->description('Incluye los mantenimientos realizados.'),
            'include_expenses' => $schema->boolean()->description('Incluye los demás gastos del vehículo (seguro, peajes, repuestos…).'),
            'limit' => $schema->integer()->description('Máximo de registros (por defecto 20, máximo 100).'),
        ];
    }
}
