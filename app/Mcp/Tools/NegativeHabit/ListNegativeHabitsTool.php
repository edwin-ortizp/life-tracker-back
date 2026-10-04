<?php

namespace App\Mcp\Tools\NegativeHabit;

use App\Mcp\Support\DateWindow;
use App\Mcp\Support\McpOutput;
use App\Models\NegativeHabitDefinition;
use App\Models\NegativeHabitLog;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Hábitos negativos que el usuario quiere reducir (p. ej. redes sociales, comida chatarra, fumar) con cuántas veces recayó en un periodo (por defecto 7 días), comparado con el periodo anterior, la última vez y los días que lleva sin hacerlo. Úsala cuando hable de vicios, recaídas, autocontrol o de algo que intenta dejar. Acompaña sin juzgar.')]
class ListNegativeHabitsTool extends Tool
{
    public function handle(Request $request): ResponseFactory
    {
        $data = $request->validate([
            ...DateWindow::rules(),
            'days' => ['nullable', 'integer', 'min:1', 'max:366'],
            'include_logs' => ['nullable', 'boolean'],
        ]);

        $window = DateWindow::fromInput($data, $data['days'] ?? 7);
        $from = $window->from->copy()->startOfDay()->timestamp;
        $to = $window->to->copy()->endOfDay()->timestamp;
        $span = $to - $from + 1;

        $habits = Auth::user()->negativeHabitDefinitions()->orderBy('name')->get();
        $logs = NegativeHabitLog::query()->whereBetween('timestamp', [$from - $span, $to])->orderByDesc('timestamp')->get()->groupBy('habit_id');
        $last = NegativeHabitLog::query()->selectRaw('habit_id, max(timestamp) as last_at')->groupBy('habit_id')->pluck('last_at', 'habit_id');
        $timezone = config('app.timezone');

        return Response::structured(McpOutput::compact([
            'period' => $window->toArray(),
            'habits' => $habits->map(function (NegativeHabitDefinition $habit) use ($logs, $last, $from, $to, $timezone, $data) {
                $all = $logs->get($habit->id, collect());
                $current = $all->filter(fn (NegativeHabitLog $log) => $log->timestamp >= $from && $log->timestamp <= $to);
                $lastAt = $last->get($habit->id) ? Carbon::createFromTimestamp((int) $last->get($habit->id), $timezone) : null;

                return McpOutput::compact([
                    'id' => $habit->id,
                    'name' => $habit->name,
                    'category' => $habit->category,
                    'description' => $habit->description,
                    'times' => $current->count(),
                    'times_previous_period' => $all->count() - $current->count(),
                    'last_on' => $lastAt?->toDateString(),
                    'days_since_last' => $lastAt ? (int) $lastAt->copy()->startOfDay()->diffInDays(Carbon::today($timezone)) : null,
                    'logs' => empty($data['include_logs']) || $current->isEmpty() ? null : $current->take(30)->map(fn (NegativeHabitLog $log) => McpOutput::compact([
                        'id' => $log->id,
                        'at' => Carbon::createFromTimestamp((int) $log->timestamp, $timezone)->format('Y-m-d H:i'),
                        'note' => $log->note,
                    ]))->values()->all(),
                ]);
            })->all(),
        ]));
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'since' => $schema->string()->description('Desde esta fecha (YYYY-MM-DD).'),
            'until' => $schema->string()->description('Hasta esta fecha (YYYY-MM-DD). Por defecto hoy.'),
            'days' => $schema->integer()->description('Días hacia atrás si no envías since (por defecto 7).'),
            'include_logs' => $schema->boolean()->description('Incluye cada registro con su hora y nota.'),
        ];
    }
}
