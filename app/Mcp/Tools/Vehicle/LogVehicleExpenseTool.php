<?php

namespace App\Mcp\Tools\Vehicle;

use App\Mcp\Tools\Vehicle\Concerns\ResolvesVehicle;
use App\Models\VehicleExpense;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Registra un gasto de un vehículo que no es combustible (seguro, impuestos, peajes, parqueadero, lavado, repuestos, multas…) en una de las categorías del usuario. Para tanqueos usa log-vehicle-fillup-tool.')]
class LogVehicleExpenseTool extends Tool
{
    use ResolvesVehicle;

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'vehicle_id' => ['nullable', 'string'],
            'vehicle_name' => ['nullable', 'string'],
            'category' => ['required', 'string', 'max:120'],
            'amount' => ['required', 'numeric', 'min:0', 'max:9999999999'],
            'date' => ['nullable', 'date'],
            'description' => ['nullable', 'string', 'max:255'],
            'odometer' => ['nullable', 'numeric', 'min:0'],
            'provider' => ['nullable', 'string', 'max:120'],
        ]);

        $only = blank($data['vehicle_id'] ?? null) && blank($data['vehicle_name'] ?? null) && Auth::user()->vehicles()->count() === 1
            ? Auth::user()->vehicles()->first()
            : null;
        $vehicle = $only ?? $this->resolveVehicle($data['vehicle_id'] ?? null, $data['vehicle_name'] ?? null);
        if ($vehicle instanceof Response) {
            return $vehicle;
        }

        $term = mb_strtolower(trim($data['category']));
        $categories = Auth::user()->vehicleExpenseCategories()->orderBy('sort_order')->get();
        $matches = $categories->filter(fn ($category) => mb_strtolower($category->name) === $term);
        if ($matches->isEmpty()) {
            $matches = $categories->filter(fn ($category) => str_contains(mb_strtolower($category->name), $term));
        }

        if ($matches->count() !== 1) {
            return Response::error(($matches->isEmpty() ? "No encontré la categoría \"{$data['category']}\"." : "Hay varias categorías que coinciden con \"{$data['category']}\".")
                .' Tus categorías: '.$categories->pluck('name')->implode(', ').'.');
        }

        $category = $matches->first();

        VehicleExpense::create([
            'vehicle_id' => $vehicle->id,
            'vehicle_expense_category_id' => $category->id,
            'spent_on' => $data['date'] ?? today()->toDateString(),
            'amount' => $data['amount'],
            'description' => filled($data['description'] ?? null) ? trim($data['description']) : null,
            'usage_reading' => $data['odometer'] ?? null,
            'provider' => filled($data['provider'] ?? null) ? trim($data['provider']) : null,
        ]);

        return Response::text("Gasto registrado en {$vehicle->name}: {$category->name}, $".number_format((float) $data['amount'], 0, ',', '.').' el '.($data['date'] ?? today()->toDateString()).'.');
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'vehicle_id' => $schema->string()->description('Id del vehículo. Alternativa a vehicle_name.'),
            'vehicle_name' => $schema->string()->description('Nombre del vehículo. Si solo hay uno puede omitirse.'),
            'category' => $schema->string()->description('Categoría del gasto según el catálogo del usuario (p. ej. "Seguro", "Peajes"). Si no coincide, el error lista las disponibles.')->required(),
            'amount' => $schema->number()->description('Valor pagado.')->required(),
            'date' => $schema->string()->description('Fecha (YYYY-MM-DD). Por defecto hoy.'),
            'description' => $schema->string()->description('Detalle del gasto.'),
            'odometer' => $schema->number()->description('Lectura del odómetro.'),
            'provider' => $schema->string()->description('Proveedor o lugar.'),
        ];
    }
}
