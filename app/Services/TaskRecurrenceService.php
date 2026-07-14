<?php

namespace App\Services;

use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TaskRecurrenceService
{
    public function suggestedNextDate(Task $task, ?Carbon $completedAt = null): Carbon
    {
        $recurrence = $task->recurrence ?? [];
        $frequency = max(1, (int) ($recurrence['frequency'] ?? 1));
        $date = ($completedAt ?? now())->copy()->startOfDay();

        return match ($recurrence['pattern'] ?? 'custom') {
            'daily' => $date->addDays($frequency),
            'weekly' => $date->addWeeks($frequency),
            'monthly' => $date->addMonthsNoOverflow($frequency),
            default => $date->addDays(max(1, (int) ($recurrence['customDays'] ?? $frequency))),
        };
    }

    /**
     * Complete the current occurrence and create the next one atomically.
     *
     * @return array{completed: bool, xp: int, streak: int, level: int, levelUp: bool, streakMilestone: bool}
     */
    public function completeAndSchedule(Task $task, Carbon $nextDate, TaskGamificationService $gamification): array
    {
        return DB::transaction(function () use ($task, $nextDate, $gamification): array {
            $current = Task::query()->lockForUpdate()->findOrFail($task->id);

            if ($current->completed || ! $current->is_recurrent) {
                return ['completed' => false, 'xp' => 0, 'streak' => 0, 'level' => 1, 'levelUp' => false, 'streakMilestone' => false];
            }

            $xp = $gamification->completionXp($current);
            $previousXp = (int) Task::where('completed', true)->sum('completion_xp');

            $current->update([
                'completed' => true,
                'completed_at' => now(),
                'completion_xp' => $xp,
            ]);

            Task::create([
                'task_code' => rand(10000, 99999),
                'title' => $current->title,
                'description' => $current->description,
                'category' => $current->category,
                'priority' => $current->priority,
                'size' => $current->size,
                'is_recurrent' => true,
                'is_private' => $current->is_private,
                'recurrence' => $current->recurrence,
                ...$this->datesForNextOccurrence($current, $nextDate),
            ]);

            $totalXp = $previousXp + $xp;
            $streaks = $gamification->streaks();

            return [
                'completed' => true,
                'xp' => $xp,
                'streak' => $streaks['current'],
                'level' => $gamification->levelForXp($totalXp),
                'levelUp' => $gamification->levelForXp($previousXp) < $gamification->levelForXp($totalXp),
                'streakMilestone' => in_array($streaks['current'], [3, 7, 14, 30, 100], true),
            ];
        });
    }

    /** @return array{start_date: Carbon|null, end_date: Carbon|null} */
    private function datesForNextOccurrence(Task $task, Carbon $nextDate): array
    {
        $nextDate = $nextDate->copy()->startOfDay();

        if ($task->start_date && $task->end_date) {
            $duration = $task->start_date->copy()->startOfDay()->diffInDays($task->end_date->copy()->startOfDay(), false);

            return ['start_date' => $nextDate, 'end_date' => $nextDate->copy()->addDays($duration)];
        }

        if ($task->end_date) {
            return ['start_date' => null, 'end_date' => $nextDate];
        }

        return ['start_date' => $nextDate, 'end_date' => null];
    }
}
