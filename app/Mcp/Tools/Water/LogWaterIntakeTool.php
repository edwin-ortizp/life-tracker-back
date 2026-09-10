<?php

namespace App\Mcp\Tools\Water;

use App\Mcp\Tools\Water\Concerns\ResolvesDrinkType;
use App\Support\WaterGoal;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Registra una toma de líquido (agua u otra bebida) del usuario autenticado y reporta el avance frente a su meta diaria.')]
class LogWaterIntakeTool extends Tool
{
    use ResolvesDrinkType;

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'drink_type_id' => ['nullable', 'string'],
            'drink_type_name' => ['nullable', 'string'],
            'amount_ml' => ['required', 'integer', 'min:1'],
            'date' => ['nullable', 'date'],
            'time' => ['nullable', 'date_format:H:i'],
        ]);

        $drinkType = $this->resolveDrinkType($data['drink_type_id'] ?? null, $data['drink_type_name'] ?? null);
        if ($drinkType instanceof Response) {
            return $drinkType;
        }

        $now = now();
        $date = $data['date'] ?? $now->toDateString();
        $time = $data['time'] ?? $now->format('H:i');
        $hydrationValue = (int) round($data['amount_ml'] * $drinkType->hydration_factor);

        Auth::user()->drinkLogs()->create([
            'date' => $date,
            'drink_type' => $drinkType->name,
            'drink_type_id' => $drinkType->id,
            'amount' => $data['amount_ml'],
            'hydration_value' => $hydrationValue,
            'time' => $time,
            'timestamp' => Carbon::createFromFormat('Y-m-d H:i', "{$date} {$time}")->timestamp,
        ]);

        $totalToday = (int) Auth::user()->drinkLogs()->whereDate('date', $date)->sum('hydration_value');
        $goal = WaterGoal::forUser(Auth::user());
        $percent = $goal > 0 ? (int) round(($totalToday / $goal) * 100) : 0;

        return Response::text("Registrado: {$data['amount_ml']} ml de {$drinkType->name}. Hoy llevas {$totalToday} ml de tu meta de {$goal} ml ({$percent}%).");
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'drink_type_id' => $schema->string()
                ->description('Identificador (UUID) del tipo de bebida en el catálogo del usuario. Alternativa a "drink_type_name".'),
            'drink_type_name' => $schema->string()
                ->description('Nombre del tipo de bebida (p. ej. "Agua", "Café"). Por defecto "agua" si se omite.'),
            'amount_ml' => $schema->integer()
                ->description('Cantidad en mililitros.')
                ->required(),
            'date' => $schema->string()
                ->description('Fecha en formato YYYY-MM-DD. Por defecto hoy.'),
            'time' => $schema->string()
                ->description('Hora en formato HH:MM. Por defecto la hora actual.'),
        ];
    }
}
