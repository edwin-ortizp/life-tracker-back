<?php

namespace App\Support\Habits\Actions;

use App\Models\HabitDefinition;
use App\Models\Task;
use App\Support\Habits\HabitAction;
use App\Support\Habits\HabitActionField;
use App\Support\Habits\HabitActionResult;
use Carbon\CarbonInterface;

class CreateTaskAction extends HabitAction
{
    public static function key(): string
    {
        return 'tasks.create';
    }

    public static function module(): string
    {
        return 'tasks';
    }

    public static function label(): string
    {
        return 'Crear una tarea';
    }

    public static function icon(): string
    {
        return 'bi-list-task';
    }

    public function fields(): array
    {
        return [
            HabitActionField::text('title', 'Título de la tarea', ['required', 'string', 'max:255'], null, 'Si lo dejas vacío se usa el nombre del hábito.', ask: true),
        ];
    }

    public function execute(HabitDefinition $habit, CarbonInterface $date, array $config, array $input): HabitActionResult
    {
        $values = $this->merge($config, $input);
        $title = trim((string) ($values['title'] ?? '')) ?: $habit->name;

        $task = Task::create([
            'task_code' => random_int(10000, 99999),
            'title' => $title,
            'start_date' => $date->toDateString(),
        ]);

        return new HabitActionResult($task, "También creé la tarea “{$title}”.");
    }
}
