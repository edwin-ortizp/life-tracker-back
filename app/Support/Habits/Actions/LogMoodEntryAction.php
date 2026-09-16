<?php

namespace App\Support\Habits\Actions;

use App\Models\HabitDefinition;
use App\Models\MoodState;
use App\Support\Habits\HabitAction;
use App\Support\Habits\HabitActionField;
use App\Support\Habits\HabitActionResult;
use App\Support\MoodLogger;
use Carbon\CarbonInterface;

class LogMoodEntryAction extends HabitAction
{
    public function __construct(private readonly MoodLogger $moodLogger) {}

    public static function key(): string
    {
        return 'mood.log_entry';
    }

    public static function module(): string
    {
        return 'mood';
    }

    public static function label(): string
    {
        return 'Registrar un estado de ánimo';
    }

    public static function icon(): string
    {
        return 'bi-emoji-smile';
    }

    public function fields(): array
    {
        $states = MoodState::query()
            ->active()
            ->orderBy('text')
            ->get()
            ->mapWithKeys(fn (MoodState $state) => [$state->id => trim("{$state->emoji} {$state->text}")])
            ->all();

        return [
            HabitActionField::select('mood_state_id', '¿Cómo te sientes?', $states, ['required', 'string'], array_key_first($states), ask: true),
        ];
    }

    public function execute(HabitDefinition $habit, CarbonInterface $date, array $config, array $input): HabitActionResult
    {
        $values = $this->merge($config, $input);
        $state = MoodState::query()->find($values['mood_state_id'] ?? null);

        if (! $state) {
            throw new \RuntimeException('La emoción configurada ya no está disponible.');
        }

        $entry = $this->moodLogger->record($state, $date->toDateString());

        return new HabitActionResult($entry, "También registré que te sientes {$state->text}.");
    }
}
