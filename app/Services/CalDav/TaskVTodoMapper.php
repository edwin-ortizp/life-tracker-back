<?php

namespace App\Services\CalDav;

use App\Models\Task;
use Carbon\Carbon;
use DateTimeZone;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Sabre\VObject\Component\VCalendar;
use Sabre\VObject\Reader;

class TaskVTodoMapper
{
    private const MAX_BYTES = 1_048_576;

    public function __construct(private readonly RecurrenceRule $recurrenceRule) {}

    /** @return array{data: array<string, mixed>, completed: bool, completed_at: ?Carbon, uid: string, raw: string} */
    public function parse(string $calendarData, ?Task $existing = null): array
    {
        if (strlen($calendarData) > self::MAX_BYTES) {
            throw new InvalidArgumentException('El recurso CalDAV supera 1 MB.');
        }

        try {
            $calendar = Reader::read($calendarData);
        } catch (\Throwable $exception) {
            throw new InvalidArgumentException('El contenido iCalendar no es válido.', previous: $exception);
        }

        $todos = $calendar->select('VTODO');
        if (count($todos) !== 1 || count($calendar->select('VEVENT')) > 0) {
            throw new InvalidArgumentException('Cada recurso debe contener exactamente un VTODO.');
        }

        $todo = array_values($todos)[0];
        $uid = trim((string) ($todo->UID ?? ''));
        if ($uid === '') {
            throw new InvalidArgumentException('VTODO debe incluir UID.');
        }
        if ($existing && $existing->caldav_uid && ! hash_equals($existing->caldav_uid, $uid)) {
            throw new InvalidArgumentException('No se puede cambiar el UID de un VTODO existente.');
        }

        $start = $this->dateProperty($todo->DTSTART ?? null);
        $end = $this->dateProperty($todo->DUE ?? null);
        $rrule = isset($todo->RRULE) ? $this->recurrenceRule->normalize((string) $todo->RRULE) : null;
        if ($rrule && ! $start['date'] && ! $end['date']) {
            throw new InvalidArgumentException('Una tarea recurrente debe tener DTSTART o DUE.');
        }
        if ($start['date'] && $end['date'] && $end['date']->lessThan($start['date'])) {
            throw new InvalidArgumentException('DUE no puede ser anterior a DTSTART.');
        }

        $categories = isset($todo->CATEGORIES) ? $todo->CATEGORIES->getParts() : [];
        $priority = max(0, min(9, (int) (string) ($todo->PRIORITY ?? '0')));
        $status = strtoupper((string) ($todo->STATUS ?? 'NEEDS-ACTION'));
        $percent = max(0, min(100, (int) (string) ($todo->{'PERCENT-COMPLETE'} ?? '0')));

        $data = [
            'title' => trim((string) ($todo->SUMMARY ?? '')) ?: 'Tarea sin título',
            'description' => filled((string) ($todo->DESCRIPTION ?? '')) ? (string) $todo->DESCRIPTION : null,
            'start_date' => $start['date'],
            'start_is_date' => $start['is_date'],
            'end_date' => $end['date'],
            'end_is_date' => $end['is_date'],
            'category' => filled($categories[0] ?? null) ? $categories[0] : null,
            'priority' => match (true) {
                $priority > 0 && $priority <= 2 => 'urgent-important',
                $priority <= 4 && $priority > 0 => 'urgent-not-important',
                $priority <= 6 && $priority > 0 => 'not-urgent-important',
                $priority > 0 => 'not-urgent-not-important',
                default => null,
            },
            'progress' => $percent,
            'is_private' => strtoupper((string) ($todo->CLASS ?? 'PUBLIC')) === 'PRIVATE',
            'size' => filled((string) ($todo->{'X-LIFETRACKER-SIZE'} ?? '')) ? (string) $todo->{'X-LIFETRACKER-SIZE'} : null,
            'estimated_time' => is_numeric((string) ($todo->{'X-LIFETRACKER-ESTIMATED-MINUTES'} ?? ''))
                ? max(0, (int) (string) $todo->{'X-LIFETRACKER-ESTIMATED-MINUTES'}) : null,
            'is_recurrent' => $rrule !== null,
            'recurrence' => $rrule ? [
                'rrule' => $rrule,
                'anchor' => ($existing?->recurrence['rrule'] ?? null) === $rrule
                    ? ($existing?->recurrence['anchor'] ?? ($start['date'] ?? $end['date'])->toIso8601String())
                    : ($start['date'] ?? $end['date'])->toIso8601String(),
                'occurrences_completed' => ($existing?->recurrence['rrule'] ?? null) === $rrule
                    ? (int) ($existing?->recurrence['occurrences_completed'] ?? 0) : 0,
            ] : null,
            'recurrence_series_id' => $rrule ? ($existing?->recurrence_series_id ?: (string) Str::uuid()) : null,
            'caldav_uid' => $uid,
            'caldav_data' => $calendarData,
        ];

        return [
            'data' => $data,
            'completed' => $status === 'COMPLETED' || $percent === 100,
            'completed_at' => isset($todo->COMPLETED)
                ? Carbon::instance($todo->COMPLETED->getDateTime(new DateTimeZone('UTC')))->setTimezone(config('app.timezone'))
                : null,
            'uid' => $uid,
            'raw' => $calendarData,
        ];
    }

    public function serialize(Task $task): string
    {
        $calendar = $this->calendarFromTask($task);
        $todo = array_values($calendar->select('VTODO'))[0];
        $preservedCategories = isset($todo->CATEGORIES) ? $todo->CATEGORIES->getParts() : [];

        foreach ([
            'UID', 'SUMMARY', 'DESCRIPTION', 'DTSTART', 'DUE', 'STATUS', 'COMPLETED',
            'PERCENT-COMPLETE', 'PRIORITY', 'CATEGORIES', 'CLASS', 'CREATED',
            'LAST-MODIFIED', 'DTSTAMP', 'SEQUENCE', 'RRULE', 'X-LIFETRACKER-SIZE',
            'X-LIFETRACKER-ESTIMATED-MINUTES',
        ] as $property) {
            unset($todo->{$property});
        }

        $todo->add('UID', $task->caldav_uid ?: $task->id.'@life-tracker');
        $todo->add('SUMMARY', $task->title);
        if (filled($task->description)) {
            $todo->add('DESCRIPTION', $task->description);
        }
        $this->addDate($todo, 'DTSTART', $task->start_date, $task->start_is_date);
        $this->addDate($todo, 'DUE', $task->end_date, $task->end_is_date);
        $todo->add('STATUS', $task->completed ? 'COMPLETED' : ($task->progress > 0 ? 'IN-PROCESS' : 'NEEDS-ACTION'));
        $todo->add('PERCENT-COMPLETE', $task->completed ? 100 : (int) $task->progress);
        if ($task->completed_at) {
            $todo->add('COMPLETED', $task->completed_at->copy()->utc());
        }
        $todo->add('PRIORITY', match ($task->priority) {
            'urgent-important' => 1,
            'urgent-not-important' => 3,
            'not-urgent-important' => 5,
            'not-urgent-not-important' => 9,
            default => 0,
        });
        if (filled($task->category)) {
            $todo->add('CATEGORIES', array_values(array_unique([$task->category, ...array_slice($preservedCategories, 1)])));
        } elseif ($preservedCategories) {
            $todo->add('CATEGORIES', $preservedCategories);
        }
        $todo->add('CLASS', $task->is_private ? 'PRIVATE' : 'PUBLIC');
        $todo->add('CREATED', $task->created_at->copy()->utc());
        $todo->add('LAST-MODIFIED', $task->updated_at->copy()->utc());
        $todo->add('DTSTAMP', $task->updated_at->copy()->utc());
        $todo->add('SEQUENCE', (int) $task->caldav_revision);
        if ($task->size) {
            $todo->add('X-LIFETRACKER-SIZE', $task->size);
        }
        if ($task->estimated_time) {
            $todo->add('X-LIFETRACKER-ESTIMATED-MINUTES', $task->estimated_time);
        }
        if ($task->is_recurrent && ($rule = $this->recurrenceRule->fromTaskRecurrence($task->recurrence))) {
            $todo->add('RRULE', $rule);
        }

        return $calendar->serialize();
    }

    private function calendarFromTask(Task $task): VCalendar
    {
        if ($task->caldav_data) {
            try {
                $calendar = Reader::read($task->caldav_data);
                if ($calendar instanceof VCalendar && count($calendar->select('VTODO')) === 1) {
                    return $calendar;
                }
            } catch (\Throwable) {
                // Fall back to a canonical document if preserved client data became invalid.
            }
        }

        $calendar = new VCalendar;
        $calendar->add('VTODO', []);

        return $calendar;
    }

    /** @return array{date: ?Carbon, is_date: bool} */
    private function dateProperty(mixed $property): array
    {
        if (! $property) {
            return ['date' => null, 'is_date' => true];
        }
        $isDate = ! $property->hasTime();
        $date = Carbon::instance($property->getDateTime(new DateTimeZone(config('app.timezone'))))
            ->setTimezone(config('app.timezone'));

        return ['date' => $date, 'is_date' => $isDate];
    }

    private function addDate(mixed $todo, string $name, ?Carbon $date, bool $isDate): void
    {
        if (! $date) {
            return;
        }
        if ($isDate) {
            $todo->add($name, $date->format('Ymd'), ['VALUE' => 'DATE']);
        } else {
            $todo->add($name, $date->copy()->setTimezone(config('app.timezone')));
        }
    }
}
