<?php

namespace App\Mcp\Tools\Goal;

use App\Mcp\Tools\Goal\Concerns\ResolvesGoal;
use App\Models\Goal;
use App\Support\GoalProgress;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\DB;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Registra avance en una meta: una nota en su bitácora (marcable como hito), un nuevo valor de su indicador numérico, o ambos. El valor actual del indicador se recalcula con el registro más reciente, igual que en la app.')]
class LogGoalProgressTool extends Tool
{
    use ResolvesGoal;

    public function handle(Request $request): Response
    {
        $data = $request->validate([
            'goal_id' => ['nullable', 'string'],
            'title' => ['nullable', 'string'],
            'note' => ['nullable', 'string', 'max:5000'],
            'is_milestone' => ['nullable', 'boolean'],
            'value' => ['nullable', 'numeric'],
            'date' => ['nullable', 'date'],
        ]);

        $goal = $this->resolveGoal($data['goal_id'] ?? null, $data['title'] ?? null);
        if ($goal instanceof Response) {
            return $goal;
        }

        $hasValue = isset($data['value']) && $data['value'] !== '';
        if (blank($data['note'] ?? null) && ! $hasValue) {
            return Response::error('Envía una nota (note), un valor del indicador (value) o ambos.');
        }

        if ($hasValue && ! GoalProgress::configuration($goal->numeric_goal)) {
            return Response::error("La meta \"{$goal->title}\" no tiene indicador numérico; registra el avance como nota.");
        }

        $date = $data['date'] ?? today()->toDateString();
        $parts = [];

        DB::transaction(function () use ($goal, $data, $date, $hasValue, &$parts) {
            if ($hasValue) {
                $goal->goalNumericEntries()->create([
                    'value' => $data['value'],
                    'date' => $date,
                    'note' => $hasValue && filled($data['note'] ?? null) && empty($data['is_milestone']) ? trim($data['note']) : null,
                ]);
                $this->syncCurrentValue($goal);
                $parts[] = 'valor '.(float) $data['value'];
            }

            // Con valor, la nota va en el registro numérico salvo que sea un hito.
            if (filled($data['note'] ?? null) && (! $hasValue || ! empty($data['is_milestone']))) {
                $goal->goalEntries()->create([
                    'text' => trim($data['note']),
                    'date' => $date,
                    'is_milestone' => (bool) ($data['is_milestone'] ?? false),
                ]);
                $parts[] = ! empty($data['is_milestone']) ? 'hito' : 'nota';
            }
        });

        $progress = GoalProgress::calculate($goal->fresh()->numeric_goal, $goal->start_date, $goal->due_date);
        $suffix = $progress ? ' Avance: '.round($progress['actualPercent']).'%'
            .($progress['expectedPercent'] !== null ? ' (esperado '.round($progress['expectedPercent']).'%)' : '').'.' : '';

        return Response::text("Avance registrado en \"{$goal->title}\" el {$date}: ".implode(' y ', $parts).'.'.$suffix);
    }

    private function syncCurrentValue(Goal $goal): void
    {
        $goal = Goal::query()->lockForUpdate()->findOrFail($goal->id);
        $kpi = GoalProgress::configuration($goal->numeric_goal);
        $latest = $goal->goalNumericEntries()->orderByDesc('date')->orderByDesc('created_at')->first();
        $numeric = $goal->numeric_goal;
        $numeric['currentValue'] = $latest ? (float) $latest->value : $kpi['startValue'];
        $goal->update(['numeric_goal' => $numeric]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'goal_id' => $schema->string()->description('Id de la meta. Alternativa a "title".'),
            'title' => $schema->string()->description('Título (o parte) de la meta.'),
            'note' => $schema->string()->description('Qué avanzó, aprendió o decidió.'),
            'is_milestone' => $schema->boolean()->description('Marca la nota como hito.'),
            'value' => $schema->number()->description('Nuevo valor del indicador numérico (p. ej. el peso de hoy).'),
            'date' => $schema->string()->description('Fecha del avance (YYYY-MM-DD). Por defecto hoy.'),
        ];
    }
}
