<?php

namespace App\Mcp\Tools\Habit;

use App\Mcp\Support\McpOutput;
use App\Models\HabitDefinition;
use App\Support\HabitProgress;
use App\Support\Habits\HabitActionField;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Lista los hábitos del usuario con su estado en una fecha (hoy por defecto), la racha actual y cuántos de los últimos 7 días se cumplieron. Úsala para hablar de rutina, constancia o qué falta hoy, y antes de completar un hábito con complete-habit-tool.')]
class ListHabitsTool extends Tool
{
    /** Días hacia atrás que se revisan para calcular la racha. */
    private const HISTORY_DAYS = 120;

    /** Selects con más opciones que esto se resumen salvo que se pidan. */
    private const INLINE_OPTIONS = 8;

    private bool $includeOptions = false;

    public function handle(Request $request): ResponseFactory
    {
        $data = $request->validate([
            'date' => ['nullable', 'date'],
            'include_action_options' => ['nullable', 'boolean'],
        ]);

        $this->includeOptions = (bool) ($data['include_action_options'] ?? false);

        $date = $data['date'] ?? today()->toDateString();

        $habits = Auth::user()->habitDefinitions()->with('action')->orderBy('base_time')->orderBy('id')->get();
        $completedIds = Auth::user()->habitCompletions()
            ->whereDate('date', $date)
            ->where('completed', true)
            ->pluck('habit_id');

        // Una sola consulta para rachas y cumplimiento reciente de todos los hábitos.
        $reference = Carbon::parse($date, config('app.timezone'))->startOfDay();
        $history = Auth::user()->habitCompletions()
            ->where('completed', true)
            ->whereDate('date', '>=', $reference->copy()->subDays(self::HISTORY_DAYS)->toDateString())
            ->whereDate('date', '<=', $reference->toDateString())
            ->get(['habit_id', 'date'])
            ->groupBy('habit_id')
            ->map(fn ($rows) => $rows->mapWithKeys(fn ($row) => [$row->date->toDateString() => true])->all());

        return Response::structured(McpOutput::compact([
            'date' => $reference->toDateString(),
            'habits' => $habits->map(function (HabitDefinition $habit) use ($completedIds, $history, $reference) {
                $done = $history->get($habit->id, []);
                $completedToday = $completedIds->contains($habit->id);

                return [
                    'id' => $habit->id,
                    'name' => $habit->name,
                    'time_of_day' => $habit->time_of_day,
                    'completed' => $completedToday,
                    // Si hoy aún no se ha hecho, la racha viva es la que llega hasta ayer.
                    'streak_days' => HabitProgress::currentStreak($done, $completedToday ? $reference : $reference->copy()->subDay()),
                    'last_7_days' => collect(range(0, 6))->filter(fn (int $offset) => isset($done[$reference->copy()->subDays($offset)->toDateString()]))->count(),
                    'action' => $this->describeAction($habit),
                ];
            })->all(),
        ]));
    }

    /**
     * Qué hace el hábito al completarse, para que el agente sepa si tendrá que
     * enviar "action_input" a complete-habit-tool.
     *
     * @return array<string, mixed>|null
     */
    private function describeAction(HabitDefinition $habit): ?array
    {
        $setting = $habit->action;
        $handler = $setting?->enabled ? $setting->handler() : null;

        if (! $handler) {
            return null;
        }

        return [
            'module' => $handler::moduleLabel(),
            'label' => $handler::label(),
            'mode' => $setting->mode,
            'required_input' => array_map(
                fn (HabitActionField $field) => $this->describeField($field),
                $setting->asksForInput() ? $handler->promptFields() : [],
            ),
        ];
    }

    /**
     * Los catálogos largos (p. ej. tipos de ejercicio) solo se envían si se piden:
     * repetirlos en cada consulta gasta contexto sin aportar.
     */
    private function describeField(HabitActionField $field): string
    {
        $details = $field->toArray();
        $options = $details['options'] ?? [];

        if ($this->includeOptions || $details['type'] !== 'select' || count($options) <= self::INLINE_OPTIONS) {
            return $field->describe();
        }

        return "{$details['key']} ({$details['label']}): ".count($options).' opciones; consulta de nuevo con include_action_options=true para verlas.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'date' => $schema->string()
                ->description('Fecha en formato YYYY-MM-DD para consultar el estado de completado. Por defecto hoy.'),
            'include_action_options' => $schema->boolean()
                ->description('Incluye los catálogos largos de opciones (p. ej. ids de tipos de ejercicio) que pide action_input. Solo hace falta justo antes de completar ese hábito.'),
        ];
    }
}
