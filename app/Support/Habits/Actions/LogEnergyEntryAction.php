<?php

namespace App\Support\Habits\Actions;

use App\Models\EnergyEntry;
use App\Models\HabitDefinition;
use App\Support\Habits\HabitAction;
use App\Support\Habits\HabitActionField;
use App\Support\Habits\HabitActionResult;
use Carbon\CarbonInterface;

class LogEnergyEntryAction extends HabitAction
{
    private const LEVELS = [
        1 => '1 · Agotado',
        2 => '2 · Bajo',
        3 => '3 · Normal',
        4 => '4 · Bien',
        5 => '5 · Pleno',
    ];

    public static function key(): string
    {
        return 'mood.log_energy';
    }

    public static function module(): string
    {
        return 'mood';
    }

    public static function label(): string
    {
        return 'Registrar tu nivel de energía';
    }

    public static function icon(): string
    {
        return 'bi-lightning-charge';
    }

    public function fields(): array
    {
        return [
            HabitActionField::select('level', '¿Con cuánta energía cuentas?', self::LEVELS, ['required', 'integer', 'between:1,5'], 3, ask: true),
        ];
    }

    public function execute(HabitDefinition $habit, CarbonInterface $date, array $config, array $input): HabitActionResult
    {
        $values = $this->merge($config, $input);
        $level = (int) ($values['level'] ?? 0);

        if ($level < 1 || $level > 5) {
            throw new \RuntimeException('El nivel de energía debe estar entre 1 y 5.');
        }

        $now = now();
        $entry = EnergyEntry::create([
            'date' => $date->toDateString(),
            'level' => $level,
            'time' => $now->format('H:i'),
            'timestamp' => $now->timestamp,
        ]);

        return new HabitActionResult($entry, "También registré tu energía en {$level}/5.");
    }
}
