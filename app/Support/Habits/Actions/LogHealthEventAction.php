<?php

namespace App\Support\Habits\Actions;

use App\Models\HabitDefinition;
use App\Models\HealthEvent;
use App\Support\Habits\HabitAction;
use App\Support\Habits\HabitActionField;
use App\Support\Habits\HabitActionResult;
use Carbon\CarbonInterface;

class LogHealthEventAction extends HabitAction
{
    public static function key(): string
    {
        return 'health.log_event';
    }

    public static function module(): string
    {
        return 'health';
    }

    public static function label(): string
    {
        return 'Registrar un evento de salud';
    }

    public static function icon(): string
    {
        return 'bi-heart-pulse';
    }

    public function fields(): array
    {
        return [
            HabitActionField::select('type', 'Tipo de evento', HealthEvent::TYPES, ['required', 'string'], 'checkup'),
            HabitActionField::text('title', '¿Qué registraste?', ['required', 'string', 'max:160'], null, 'Si lo dejas vacío se usa el nombre del hábito.', ask: true),
        ];
    }

    public function execute(HabitDefinition $habit, CarbonInterface $date, array $config, array $input): HabitActionResult
    {
        $values = $this->merge($config, $input);
        $title = trim((string) ($values['title'] ?? '')) ?: $habit->name;
        $type = $values['type'] ?? 'checkup';

        if (! array_key_exists($type, HealthEvent::TYPES)) {
            throw new \RuntimeException('El tipo de evento de salud configurado ya no es válido.');
        }

        $event = HealthEvent::create([
            'type' => $type,
            'title' => $title,
            'event_date' => $date->toDateString(),
        ]);

        return new HabitActionResult($event, "También registré “{$title}” en tu salud.");
    }
}
