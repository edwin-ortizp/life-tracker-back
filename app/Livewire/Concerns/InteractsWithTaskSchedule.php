<?php

namespace App\Livewire\Concerns;

use App\Models\Task;
use Carbon\Carbon;

trait InteractsWithTaskSchedule
{
    public function loadTaskSchedule(Task $task): void
    {
        $this->startDate = $task->start_date?->format('Y-m-d\\TH:i');
        $this->endDate = $task->end_date?->format('Y-m-d\\TH:i');
        $this->estimatedTime = $task->estimated_time;
    }

    public function applyDuration(int $minutes): void
    {
        $this->applyDurationTo('startDate', 'endDate', 'estimatedTime', $minutes);
    }

    public function applyBulkDuration(int $minutes): void
    {
        $this->applyDurationTo('bulkStartDate', 'bulkEndDate', 'bulkEstimatedTime', $minutes);
    }

    public function updatedStartDate(): void
    {
        $this->synchronizeSchedule('startDate', 'endDate', 'estimatedTime');
    }

    public function updatingStartDate(?string $newStartDate): void
    {
        $this->shiftEndWithStart('startDate', 'endDate', $newStartDate);
    }

    public function updatedEndDate(): void
    {
        $this->synchronizeSchedule('startDate', 'endDate', 'estimatedTime');
    }

    public function updatedBulkStartDate(): void
    {
        $this->synchronizeSchedule('bulkStartDate', 'bulkEndDate', 'bulkEstimatedTime');
    }

    public function updatingBulkStartDate(?string $newStartDate): void
    {
        $this->shiftEndWithStart('bulkStartDate', 'bulkEndDate', $newStartDate);
    }

    public function updatedBulkEndDate(): void
    {
        $this->synchronizeSchedule('bulkStartDate', 'bulkEndDate', 'bulkEstimatedTime');
    }

    protected function taskScheduleData(): ?array
    {
        return $this->scheduleDataFor('startDate', 'endDate', 'estimatedTime');
    }

    protected function bulkTaskScheduleData(): ?array
    {
        return $this->scheduleDataFor('bulkStartDate', 'bulkEndDate', 'bulkEstimatedTime', 'bulkEndDate');
    }

    private function applyDurationTo(string $startProperty, string $endProperty, string $estimatedProperty, int $minutes): void
    {
        $start = $this->scheduleDate($this->{$startProperty}) ?? now()->setSecond(0);

        $this->{$startProperty} = $start->format('Y-m-d\\TH:i');
        $this->{$endProperty} = $start->copy()->addMinutes($minutes)->format('Y-m-d\\TH:i');
        $this->{$estimatedProperty} = $minutes;
    }

    private function synchronizeSchedule(string $startProperty, string $endProperty, string $estimatedProperty): void
    {
        $start = $this->scheduleDate($this->{$startProperty});
        $end = $this->scheduleDate($this->{$endProperty});

        if ($start && $end && $end->greaterThanOrEqualTo($start)) {
            $this->{$estimatedProperty} = $start->diffInMinutes($end);
        }
    }

    private function shiftEndWithStart(string $startProperty, string $endProperty, ?string $newStartValue): void
    {
        $oldStart = $this->scheduleDate($this->{$startProperty});
        $newStart = $this->scheduleDate($newStartValue);
        $end = $this->scheduleDate($this->{$endProperty});

        if (! $oldStart || ! $newStart || ! $end || $end->lessThan($oldStart)) {
            return;
        }

        $this->{$endProperty} = $newStart
            ->copy()
            ->addSeconds((int) $oldStart->diffInSeconds($end))
            ->format('Y-m-d\\TH:i');
    }

    private function scheduleDataFor(string $startProperty, string $endProperty, string $estimatedProperty, ?string $errorProperty = null): ?array
    {
        $start = $this->scheduleDate($this->{$startProperty});
        $end = $this->scheduleDate($this->{$endProperty});
        $errorProperty ??= $endProperty;
        $this->resetErrorBag($errorProperty);

        if ($start && $end && $end->lessThan($start)) {
            $this->addError($errorProperty, 'La fecha y hora de finalización debe ser posterior al inicio.');

            return null;
        }

        if ($start && $end) {
            $this->{$estimatedProperty} = $start->diffInMinutes($end);
        }

        return [
            'start_date' => $start,
            'end_date' => $end,
            'estimated_time' => $this->{$estimatedProperty} ?: null,
        ];
    }

    private function scheduleDate(?string $value): ?Carbon
    {
        return filled($value) ? Carbon::parse($value) : null;
    }
}
