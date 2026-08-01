<?php

namespace Tests\Unit;

use App\Models\Task;
use App\Services\CalDav\RecurrenceRule;
use App\Services\CalDav\TaskVTodoMapper;
use Carbon\Carbon;
use InvalidArgumentException;
use Tests\TestCase;

class CalDavTaskMapperTest extends TestCase
{
    public function test_it_parses_core_vtodo_fields_and_native_recurrence(): void
    {
        $result = app(TaskVTodoMapper::class)->parse($this->ics([
            'UID:task-1',
            'SUMMARY:Preparar informe',
            'DESCRIPTION:Revisar resultados',
            'DTSTART;VALUE=DATE:20260803',
            'DUE;TZID=America/Bogota:20260803T103000',
            'PRIORITY:1',
            'CATEGORIES:trabajo,importante',
            'CLASS:PRIVATE',
            'RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=5',
        ]));

        $this->assertSame('task-1', $result['uid']);
        $this->assertSame('Preparar informe', $result['data']['title']);
        $this->assertSame('trabajo', $result['data']['category']);
        $this->assertSame('urgent-important', $result['data']['priority']);
        $this->assertTrue($result['data']['start_is_date']);
        $this->assertFalse($result['data']['end_is_date']);
        $this->assertTrue($result['data']['is_private']);
        $this->assertSame('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=5', $result['data']['recurrence']['rrule']);
    }

    public function test_it_serializes_a_task_as_vtodo(): void
    {
        $task = new Task([
            'title' => 'Tarea privada',
            'description' => 'Detalle',
            'start_date' => '2026-08-03',
            'start_is_date' => true,
            'end_date' => '2026-08-03 10:30:00',
            'end_is_date' => false,
            'priority' => 'not-urgent-important',
            'category' => 'personal',
            'is_private' => true,
            'is_recurrent' => true,
            'recurrence' => ['rrule' => 'FREQ=DAILY;COUNT=3'],
        ]);
        $task->id = '11111111-1111-4111-8111-111111111111';
        $task->user_id = 1;
        $task->caldav_revision = 2;
        $task->created_at = Carbon::parse('2026-08-01 10:00');
        $task->updated_at = Carbon::parse('2026-08-02 10:00');

        $ics = app(TaskVTodoMapper::class)->serialize($task);

        $this->assertStringContainsString('BEGIN:VTODO', $ics);
        $this->assertStringContainsString('DTSTART;VALUE=DATE:20260803', $ics);
        $this->assertStringContainsString('DUE;TZID=America/Bogota:20260803T103000', $ics);
        $this->assertStringContainsString('RRULE:FREQ=DAILY;COUNT=3', $ics);
        $this->assertStringContainsString('CLASS:PRIVATE', $ics);
        $this->assertStringContainsString('SEQUENCE:2', $ics);
    }

    public function test_it_rejects_unsupported_recurrence_parts(): void
    {
        $this->expectException(InvalidArgumentException::class);
        app(RecurrenceRule::class)->normalize('FREQ=HOURLY;INTERVAL=1');
    }

    private function ics(array $properties): string
    {
        return implode("\r\n", [
            'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Life Tracker Tests//EN',
            'BEGIN:VTODO', ...$properties, 'END:VTODO', 'END:VCALENDAR', '',
        ]);
    }
}
