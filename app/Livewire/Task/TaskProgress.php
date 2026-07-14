<?php

namespace App\Livewire\Task;

use App\Models\Task;
use App\Services\TaskGamificationService;
use Carbon\Carbon;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Progreso de tareas')]
class TaskProgress extends Component
{
    public function render(TaskGamificationService $gamification)
    {
        $startDate = today()->subDays(6)->startOfDay();
        $endDate = now();
        $completedTasks = Task::query()
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [$startDate, $endDate])
            ->get();

        $dailyProgress = collect(range(0, 6))->map(function (int $offset) use ($startDate, $completedTasks): array {
            $date = $startDate->copy()->addDays($offset);
            $tasks = $completedTasks->filter(fn (Task $task) => $task->completed_at->isSameDay($date));

            return [
                'date' => $date,
                'count' => $tasks->count(),
                'xp' => (int) $tasks->sum('completion_xp'),
            ];
        });

        $distribution = function (string $attribute) use ($completedTasks): array {
            return $completedTasks
                ->groupBy(fn (Task $task) => $task->{$attribute} ?: 'Sin definir')
                ->map(fn ($tasks, string $label) => [
                    'label' => $label,
                    'count' => $tasks->count(),
                    'xp' => (int) $tasks->sum('completion_xp'),
                ])
                ->sortByDesc('xp')
                ->values()
                ->all();
        };

        $scheduledCompleted = Task::query()
            ->whereNotNull('completed_at')
            ->get()
            ->filter(fn (Task $task) => $this->scheduledDate($task) !== null);
        $onTimeCompleted = $scheduledCompleted->filter(fn (Task $task) => $task->completed_at->isSameDay($this->scheduledDate($task)))->count();
        $onTimeRate = $scheduledCompleted->isEmpty() ? 0 : (int) round($onTimeCompleted / $scheduledCompleted->count() * 100);
        $overdueCount = Task::query()
            ->where('completed', false)
            ->get()
            ->filter(fn (Task $task) => ($scheduled = $this->scheduledDate($task)) && $scheduled->lt(today()))
            ->count();

        return view('livewire.task.task-progress', [
            'level' => $gamification->levelProgress(),
            'streaks' => $gamification->streaks(),
            'dailyProgress' => $dailyProgress,
            'maxDailyXp' => max(1, $dailyProgress->max('xp')),
            'categoryDistribution' => $distribution('category'),
            'priorityDistribution' => $distribution('priority'),
            'sizeDistribution' => $distribution('size'),
            'onTimeRate' => $onTimeRate,
            'onTimeCompleted' => $onTimeCompleted,
            'scheduledCompletedCount' => $scheduledCompleted->count(),
            'overdueCount' => $overdueCount,
        ]);
    }

    private function scheduledDate(Task $task): ?Carbon
    {
        return $task->start_date ?? $task->end_date;
    }
}
