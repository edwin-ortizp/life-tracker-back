<?php

namespace App\Mcp\Tools\Water;

use App\Mcp\Support\DateWindow;
use App\Mcp\Support\McpOutput;
use App\Models\DrinkLog;
use App\Support\WaterGoal;
use App\Support\WaterProgress;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Hidratación del usuario por día en un periodo (por defecto los últimos 7 días): mililitros hidratados contra su meta diaria, días cumplidos y racha. Úsala cuando hable de agua, deshidratación, dolor de cabeza, cálculos o síntomas urinarios o renales, o de cómo va su rutina.')]
class ListWaterIntakeTool extends Tool
{
    public function handle(Request $request): ResponseFactory
    {
        $data = $request->validate([
            ...DateWindow::rules(),
            'days' => ['nullable', 'integer', 'min:1', 'max:120'],
            'include_drinks' => ['nullable', 'boolean'],
        ]);

        $window = DateWindow::fromInput($data, $data['days'] ?? 7);
        $goal = WaterGoal::forUser(Auth::user());
        $totals = WaterProgress::totals($window->from, $window->to);

        $days = collect();
        for ($day = $window->to->copy(); $day->gte($window->from); $day->subDay()) {
            $total = (int) ($totals[$day->toDateString()] ?? 0);
            $days->push(['date' => $day->toDateString(), 'hydration_ml' => $total, 'goal_met' => $goal > 0 && $total >= $goal]);
        }

        $drinks = empty($data['include_drinks']) ? null : Auth::user()->drinkLogs()
            ->with('drinkType')
            ->whereDate('date', '>=', $window->fromDate())
            ->whereDate('date', '<=', $window->toDate())
            ->orderByDesc('date')
            ->orderByDesc('timestamp')
            ->limit(100)
            ->get()
            ->map(fn (DrinkLog $log) => [
                'date' => $log->date->toDateString(),
                'time' => $log->time,
                'drink' => $log->drinkType?->name ?? $log->drink_type,
                'amount_ml' => (int) $log->amount,
                'hydration_ml' => (int) $log->hydration_value,
            ])->all();

        return Response::structured(McpOutput::compact([
            'period' => $window->toArray(),
            'daily_goal_ml' => $goal,
            'summary' => [
                'average_ml' => (int) round($days->avg('hydration_ml')),
                'days_goal_met' => $days->where('goal_met', true)->count(),
                'days' => $days->count(),
                'current_streak' => WaterProgress::streak($goal, Carbon::today(config('app.timezone'))),
            ],
            'by_day' => $days->all(),
            'drinks' => $drinks,
        ]));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'since' => $schema->string()->description('Desde esta fecha (YYYY-MM-DD).'),
            'until' => $schema->string()->description('Hasta esta fecha (YYYY-MM-DD). Por defecto hoy.'),
            'days' => $schema->integer()->description('Días hacia atrás si no envías since (por defecto 7).'),
            'include_drinks' => $schema->boolean()->description('Incluye cada bebida registrada, no solo los totales por día.'),
        ];
    }
}
