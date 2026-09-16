<?php

namespace App\Support\Habits\Actions;

use App\Models\HabitDefinition;
use App\Models\Relationship;
use App\Models\RelationshipEvent;
use App\Support\EventDate;
use App\Support\Habits\HabitAction;
use App\Support\Habits\HabitActionField;
use App\Support\Habits\HabitActionResult;
use Carbon\Carbon;
use Carbon\CarbonInterface;

class LogRelationshipEventAction extends HabitAction
{
    public static function key(): string
    {
        return 'relationships.log_event';
    }

    public static function module(): string
    {
        return 'relationships';
    }

    public static function label(): string
    {
        return 'Registrar un evento con un contacto';
    }

    public static function icon(): string
    {
        return 'bi-people';
    }

    public function fields(): array
    {
        $contacts = Relationship::query()
            ->get()
            ->sortBy(fn (Relationship $contact) => $contact->displayName())
            ->mapWithKeys(fn (Relationship $contact) => [$contact->id => $contact->displayName()])
            ->all();

        return [
            HabitActionField::select('relationship_id', 'Contacto', $contacts, ['required', 'string'], array_key_first($contacts)),
            HabitActionField::select('category', 'Categoría', RelationshipEvent::CATEGORIES, ['required', 'string'], array_key_first(RelationshipEvent::CATEGORIES)),
            HabitActionField::text('title', '¿Qué pasó?', ['required', 'string', 'max:255'], null, ask: true),
        ];
    }

    public function execute(HabitDefinition $habit, CarbonInterface $date, array $config, array $input): HabitActionResult
    {
        $values = $this->merge($config, $input);
        $contact = Relationship::query()->find($values['relationship_id'] ?? null);

        if (! $contact) {
            throw new \RuntimeException('El contacto configurado ya no existe.');
        }

        $title = trim((string) ($values['title'] ?? '')) ?: $habit->name;

        $event = $contact->relationshipEvents()->create([
            'title' => $title,
            'category' => $values['category'],
            ...EventDate::day(Carbon::parse($date->toDateString()))->toAttributes(),
        ]);

        return new HabitActionResult($event, "También registré “{$title}” con {$contact->displayName()}.");
    }
}
