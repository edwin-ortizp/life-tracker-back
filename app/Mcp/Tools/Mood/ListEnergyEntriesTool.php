<?php

namespace App\Mcp\Tools\Mood;

use App\Mcp\Support\DateWindow;
use App\Mcp\Support\McpOutput;
use App\Models\EnergyEntry;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Niveles de energía (1-5) registrados por el usuario en un periodo (por defecto los últimos 14 días), con promedio general y por día. Úsala cuando hable de cansancio, agotamiento o rendimiento, o para cruzar la energía con sueño, salud o ejercicio.')]
class ListEnergyEntriesTool extends Tool
{
    public function handle(Request $request): ResponseFactory
    {
        $data = $request->validate([
            ...DateWindow::rules(),
            'days' => ['nullable', 'integer', 'min:1', 'max:366'],
            'summary_only' => ['nullable', 'boolean'],
        ]);

        $window = DateWindow::fromInput($data, $data['days'] ?? 14);

        $entries = Auth::user()->energyEntries()
            ->whereDate('date', '>=', $window->fromDate())
            ->whereDate('date', '<=', $window->toDate())
            ->orderByDesc('date')
            ->orderByDesc('timestamp')
            ->get();

        return Response::structured(McpOutput::compact([
            'period' => $window->toArray(),
            'summary' => [
                'entries' => $entries->count(),
                'average_level' => $entries->isEmpty() ? null : round($entries->avg('level'), 2),
                'lowest_day' => $this->extremeDay($entries, 'min'),
                'highest_day' => $this->extremeDay($entries, 'max'),
            ],
            'by_day' => $entries->groupBy(fn (EnergyEntry $entry) => $entry->date->toDateString())
                ->map(fn ($day, $date) => ['date' => $date, 'average_level' => round($day->avg('level'), 2), 'entries' => $day->count()])
                ->values()->all(),
            'entries' => ! empty($data['summary_only']) ? null : $entries->take(60)->map(fn (EnergyEntry $entry) => [
                'id' => $entry->id,
                'date' => $entry->date->toDateString(),
                'time' => $entry->time,
                'level' => (int) $entry->level,
                'comment' => $entry->comment,
            ])->values()->all(),
        ]));
    }

    private function extremeDay($entries, string $direction): ?string
    {
        if ($entries->isEmpty()) {
            return null;
        }

        $days = $entries->groupBy(fn (EnergyEntry $entry) => $entry->date->toDateString())->map(fn ($day) => $day->avg('level'));
        $target = $direction === 'min' ? $days->min() : $days->max();

        return $days->search($target);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'since' => $schema->string()->description('Desde esta fecha (YYYY-MM-DD).'),
            'until' => $schema->string()->description('Hasta esta fecha (YYYY-MM-DD). Por defecto hoy.'),
            'days' => $schema->integer()->description('Días hacia atrás si no envías since (por defecto 14).'),
            'summary_only' => $schema->boolean()->description('Devuelve solo resumen y promedio por día.'),
        ];
    }
}
