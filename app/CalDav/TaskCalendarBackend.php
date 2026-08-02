<?php

namespace App\CalDav;

use App\Models\CalDavChange;
use App\Models\Task;
use App\Services\CalDav\TaskVTodoMapper;
use App\Services\TaskGamificationService;
use App\Services\TaskRecurrenceService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Sabre\CalDAV;
use Sabre\CalDAV\Backend\AbstractBackend;
use Sabre\CalDAV\Backend\SyncSupport;
use Sabre\DAV\Exception\BadRequest;
use Sabre\DAV\Exception\Forbidden;

class TaskCalendarBackend extends AbstractBackend implements SyncSupport
{
    public function __construct(private readonly TaskVTodoMapper $mapper) {}

    public function getCalendarsForUser($principalUri): array
    {
        if (! Auth::check() || $principalUri !== 'principals/'.Auth::user()->email) {
            return [];
        }

        $token = (string) (CalDavChange::query()->where('user_id', Auth::id())->max('id') ?: 0);

        return [[
            'id' => 'tasks:'.Auth::id(),
            'uri' => 'tasks',
            'principaluri' => $principalUri,
            '{DAV:}displayname' => 'Life Tracker',
            '{http://calendarserver.org/ns/}getctag' => 'http://sabre.io/ns/sync/'.$token,
            '{http://sabredav.org/ns}sync-token' => $token,
            '{urn:ietf:params:xml:ns:caldav}supported-calendar-component-set' => new CalDAV\Xml\Property\SupportedCalendarComponentSet(['VTODO']),
        ]];
    }

    public function createCalendar($principalUri, $calendarUri, array $properties): never
    {
        throw new Forbidden('Life Tracker expone una única lista de tareas.');
    }

    public function deleteCalendar($calendarId): never
    {
        throw new Forbidden('La lista de Life Tracker no se puede eliminar.');
    }

    public function getCalendarObjects($calendarId): array
    {
        $this->assertCalendar($calendarId);

        return $this->visibleTasks()->get()->map(fn (Task $task) => $this->objectData($task))->all();
    }

    public function getCalendarObject($calendarId, $objectUri): ?array
    {
        $this->assertCalendar($calendarId);
        $task = $this->findByUri($objectUri);

        return $task ? $this->objectData($task) : null;
    }

    public function createCalendarObject($calendarId, $objectUri, $calendarData): string
    {
        $this->assertCalendar($calendarId);
        $this->assertUri($objectUri);
        if ($this->findByUri($objectUri)) {
            throw new BadRequest('Ya existe un recurso con esa URI.');
        }

        try {
            $parsed = $this->mapper->parse($calendarData);
        } catch (\InvalidArgumentException $exception) {
            throw new BadRequest($exception->getMessage());
        }
        if (Task::query()->where('caldav_uid', $parsed['uid'])->exists()) {
            throw new BadRequest('Ya existe una tarea con ese UID.');
        }

        $task = Task::create([
            ...$parsed['data'],
            'caldav_uri' => $objectUri,
            'task_code' => random_int(10000, 99999),
        ]);
        $this->applyCompletion($task, $parsed['completed'], $parsed['completed_at']);

        return $this->objectData($task->fresh())['etag'];
    }

    public function updateCalendarObject($calendarId, $objectUri, $calendarData): string
    {
        $this->assertCalendar($calendarId);
        $task = $this->findByUri($objectUri);
        if (! $task) {
            throw new BadRequest('La tarea no existe.');
        }

        try {
            $parsed = $this->mapper->parse($calendarData, $task);
        } catch (\InvalidArgumentException $exception) {
            throw new BadRequest($exception->getMessage());
        }

        $wasCompleted = $task->completed;
        $data = $parsed['data'];
        unset($data['completed'], $data['completed_at'], $data['completion_xp']);
        $task->update($data);
        if ($parsed['completed'] !== $wasCompleted) {
            $this->applyCompletion($task->fresh(), $parsed['completed'], $parsed['completed_at']);
        }

        return $this->objectData($task->fresh())['etag'];
    }

    public function deleteCalendarObject($calendarId, $objectUri): void
    {
        $this->assertCalendar($calendarId);
        $task = $this->findByUri($objectUri);
        if (! $task) {
            throw new BadRequest('La tarea no existe.');
        }
        $task->delete();
    }

    public function getChangesForCalendar($calendarId, $syncToken, $syncLevel, $limit = null): ?array
    {
        $this->assertCalendar($calendarId);
        $current = (int) (CalDavChange::query()->where('user_id', Auth::id())->max('id') ?: 0);
        if ($syncToken === null) {
            return [
                'syncToken' => (string) $current,
                'added' => $this->visibleTasks()->get()->map(fn (Task $task) => $this->uri($task))->all(),
                'modified' => [],
                'deleted' => [],
            ];
        }
        if (! ctype_digit((string) $syncToken) || (int) $syncToken > $current) {
            return null;
        }

        $changes = CalDavChange::query()
            ->where('user_id', Auth::id())
            ->where('id', '>', (int) $syncToken)
            ->orderBy('id')
            ->get()
            ->groupBy('uri');
        $added = $modified = $deleted = [];
        foreach ($changes as $uri => $entries) {
            $last = $entries->last();
            if ($last->operation === 'deleted') {
                $deleted[] = $uri;
            } elseif ($entries->contains('operation', 'created')) {
                $added[] = $uri;
            } else {
                $modified[] = $uri;
            }
        }

        return compact('added', 'modified', 'deleted') + ['syncToken' => (string) $current];
    }

    private function objectData(Task $task): array
    {
        $data = $this->mapper->serialize($task);

        return [
            'id' => $task->id,
            'calendarid' => 'tasks:'.$task->user_id,
            'uri' => $this->uri($task),
            'etag' => '"'.$task->caldav_revision.'-'.sha1($data).'"',
            'lastmodified' => $task->updated_at->timestamp,
            'size' => strlen($data),
            'calendardata' => $data,
            'component' => 'vtodo',
        ];
    }

    private function visibleTasks()
    {
        return Task::query()->where('is_recurrence_history', false);
    }

    private function findByUri(string $uri): ?Task
    {
        $task = $this->visibleTasks()->where('caldav_uri', $uri)->first();
        if ($task || ! str_ends_with($uri, '.ics')) {
            return $task;
        }

        return $this->visibleTasks()->find(substr($uri, 0, -4));
    }

    private function uri(Task $task): string
    {
        return $task->caldav_uri ?: $task->id.'.ics';
    }

    private function assertCalendar(mixed $calendarId): void
    {
        if (! Auth::check() || $calendarId !== 'tasks:'.Auth::id()) {
            throw new Forbidden('No tienes acceso a este calendario.');
        }
    }

    private function assertUri(string $uri): void
    {
        if (! preg_match('/^[A-Za-z0-9._-]+\.ics$/', $uri) || strlen($uri) > 255) {
            throw new BadRequest('La URI del recurso no es válida.');
        }
    }

    private function applyCompletion(Task $task, bool $completed, ?Carbon $completedAt = null): void
    {
        $gamification = app(TaskGamificationService::class);
        if ($completed && ! $task->completed) {
            if ($task->is_recurrent) {
                app(TaskRecurrenceService::class)->completeAndScheduleAutomatically($task, $gamification, $completedAt);
            } else {
                $gamification->complete($task, $completedAt);
            }
        } elseif (! $completed && $task->completed) {
            $gamification->reopen($task);
        }
    }
}
