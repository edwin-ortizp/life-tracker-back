<?php

namespace App\Mcp\Tools\Habit;

use App\Models\HabitDefinition;
use App\Support\Habits\HabitActionField;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Lista los hábitos del usuario autenticado y si están completados en una fecha dada (hoy por defecto).')]
class ListHabitsTool extends Tool
{
    public function handle(Request $request): ResponseFactory
    {
        $data = $request->validate([
            'date' => ['nullable', 'date'],
        ]);

        $date = $data['date'] ?? today()->toDateString();

        $habits = Auth::user()->habitDefinitions()->with('action')->orderBy('base_time')->orderBy('id')->get();
        $completedIds = Auth::user()->habitCompletions()
            ->whereDate('date', $date)
            ->where('completed', true)
            ->pluck('habit_id');

        return Response::structured([
            'habits' => $habits->map(fn (HabitDefinition $habit) => [
                'id' => $habit->id,
                'name' => $habit->name,
                'time_of_day' => $habit->time_of_day,
                'completed' => $completedIds->contains($habit->id),
                'action' => $this->describeAction($habit),
            ])->all(),
        ]);
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
                fn (HabitActionField $field) => $field->describe(),
                $setting->asksForInput() ? $handler->promptFields() : [],
            ),
        ];
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'date' => $schema->string()
                ->description('Fecha en formato YYYY-MM-DD para consultar el estado de completado. Por defecto hoy.'),
        ];
    }
}
