<?php

namespace App\Livewire\Concerns;

use App\Models\Task;
use App\Services\TaskGamificationService;
use App\Services\TaskRecurrenceService;
use Carbon\Carbon;

trait HandlesRecurringTaskCompletion
{
    public bool $showRecurringCompletion = false;

    public ?string $recurringTaskId = null;

    public ?string $nextOccurrenceDate = null;

    protected function prepareRecurringCompletion(Task $task): bool
    {
        if (! $task->is_recurrent || $task->completed) {
            return false;
        }

        $this->recurringTaskId = $task->id;
        $this->nextOccurrenceDate = app(TaskRecurrenceService::class)
            ->suggestedNextDate($task)
            ->toDateString();
        $this->showRecurringCompletion = true;

        return true;
    }

    public function cancelRecurringCompletion(): void
    {
        $this->showRecurringCompletion = false;
        $this->recurringTaskId = null;
        $this->nextOccurrenceDate = null;
        $this->resetValidation('nextOccurrenceDate');
    }

    public function confirmRecurringCompletion(TaskGamificationService $gamification): ?array
    {
        $this->validate(['nextOccurrenceDate' => ['required', 'date']]);

        $task = Task::find($this->recurringTaskId);

        if (! $task || ! $task->is_recurrent || $task->completed) {
            $this->cancelRecurringCompletion();

            return null;
        }

        $result = app(TaskRecurrenceService::class)->completeAndSchedule(
            $task,
            Carbon::parse($this->nextOccurrenceDate),
            $gamification,
        );

        $this->cancelRecurringCompletion();

        if ($result['completed']) {
            $this->dispatch('task-completed', ...$result);
        }

        return $result;
    }
}
