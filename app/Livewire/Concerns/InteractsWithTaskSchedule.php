<?php

namespace App\Livewire\Concerns;

use App\Models\Task;
use Carbon\Carbon;

trait InteractsWithTaskSchedule
{
    public ?string $startTime = null;

    public ?string $endTime = null;

    public ?string $bulkStartTime = null;

    public ?string $bulkEndTime = null;

    public function loadTaskSchedule(Task $task): void
    {
        $this->startDate = $task->start_date?->format('Y-m-d');
        $this->startTime = $task->start_date?->format('H:i');
        $this->endDate = $task->end_date?->format('Y-m-d');
        $this->endTime = $task->end_date?->format('H:i');
        $this->estimatedTime = $task->estimated_time;
    }

    public function applyDuration(int $minutes): void
    {
        $this->applyDurationTo('startDate', 'startTime', 'endDate', 'endTime', 'estimatedTime', $minutes);
        $this->size = $this->sizeFromMinutes($minutes);
    }

    public function applyBulkDuration(int $minutes): void
    {
        $this->applyDurationTo('bulkStartDate', 'bulkStartTime', 'bulkEndDate', 'bulkEndTime', 'bulkEstimatedTime', $minutes);
        $this->bulkSize = $this->sizeFromMinutes($minutes);
    }

    public function updatedStartDate(): void
    {
        $this->synchronizeSchedule('startDate', 'startTime', 'endDate', 'endTime', 'estimatedTime');
    }

    public function updatingStartDate(?string $newStartDate): void
    {
        $this->shiftEndWithStart('startDate', 'startTime', 'endDate', 'endTime', $newStartDate, $this->startTime);
    }

    public function updatedEndDate(): void
    {
        $this->synchronizeSchedule('startDate', 'startTime', 'endDate', 'endTime', 'estimatedTime');
    }

    public function updatingStartTime(?string $newStartTime): void
    {
        $this->shiftEndWithStart('startDate', 'startTime', 'endDate', 'endTime', $this->startDate, $newStartTime);
    }

    public function updatedStartTime(): void
    {
        $this->synchronizeSchedule('startDate', 'startTime', 'endDate', 'endTime', 'estimatedTime');
    }

    public function updatedEndTime(): void
    {
        $this->synchronizeSchedule('startDate', 'startTime', 'endDate', 'endTime', 'estimatedTime');
    }

    public function updatedBulkStartDate(): void
    {
        $this->synchronizeSchedule('bulkStartDate', 'bulkStartTime', 'bulkEndDate', 'bulkEndTime', 'bulkEstimatedTime');
    }

    public function updatingBulkStartDate(?string $newStartDate): void
    {
        $this->shiftEndWithStart('bulkStartDate', 'bulkStartTime', 'bulkEndDate', 'bulkEndTime', $newStartDate, $this->bulkStartTime);
    }

    public function updatedBulkEndDate(): void
    {
        $this->synchronizeSchedule('bulkStartDate', 'bulkStartTime', 'bulkEndDate', 'bulkEndTime', 'bulkEstimatedTime');
    }

    public function updatedBulkStartTime(): void
    {
        $this->synchronizeSchedule('bulkStartDate', 'bulkStartTime', 'bulkEndDate', 'bulkEndTime', 'bulkEstimatedTime');
    }

    public function updatedBulkEndTime(): void
    {
        $this->synchronizeSchedule('bulkStartDate', 'bulkStartTime', 'bulkEndDate', 'bulkEndTime', 'bulkEstimatedTime');
    }

    protected function taskScheduleData(): ?array
    {
        return $this->scheduleDataFor('startDate', 'startTime', 'endDate', 'endTime', 'estimatedTime');
    }

    protected function bulkTaskScheduleData(): ?array
    {
        return $this->scheduleDataFor('bulkStartDate', 'bulkStartTime', 'bulkEndDate', 'bulkEndTime', 'bulkEstimatedTime', 'bulkEndDate');
    }

    private function applyDurationTo(string $startDateProperty, string $startTimeProperty, string $endDateProperty, string $endTimeProperty, string $estimatedProperty, int $minutes): void
    {
        $start = $this->scheduleDate($this->{$startDateProperty}, $this->{$startTimeProperty}) ?? now()->setSecond(0);

        $this->setScheduleDate($startDateProperty, $startTimeProperty, $start);
        $this->setScheduleDate($endDateProperty, $endTimeProperty, $start->copy()->addMinutes($minutes));
        $this->{$estimatedProperty} = $minutes;
    }

    private function synchronizeSchedule(string $startDateProperty, string $startTimeProperty, string $endDateProperty, string $endTimeProperty, string $estimatedProperty): void
    {
        $sizeProperty = str_starts_with($estimatedProperty, 'bulk') ? 'bulkSize' : 'size';
        $start = $this->scheduleDate($this->{$startDateProperty}, $this->{$startTimeProperty});
        $end = $this->scheduleDate($this->{$endDateProperty}, $this->{$endTimeProperty});

        if ($start && $end && $end->greaterThanOrEqualTo($start)) {
            $minutes = (int) $start->diffInMinutes($end);
            $this->{$estimatedProperty} = $minutes;
            $this->{$sizeProperty} = $this->sizeFromMinutes($minutes);
        }
    }

    private function shiftEndWithStart(string $startDateProperty, string $startTimeProperty, string $endDateProperty, string $endTimeProperty, ?string $newStartDate, ?string $newStartTime): void
    {
        $oldStart = $this->scheduleDate($this->{$startDateProperty}, $this->{$startTimeProperty});
        $newStart = $this->scheduleDate($newStartDate, $newStartTime);
        $end = $this->scheduleDate($this->{$endDateProperty}, $this->{$endTimeProperty});

        if (! $oldStart || ! $newStart || ! $end || $end->lessThan($oldStart)) {
            return;
        }

        $this->setScheduleDate($endDateProperty, $endTimeProperty, $newStart->copy()->addSeconds((int) $oldStart->diffInSeconds($end)));
    }

    private function scheduleDataFor(string $startDateProperty, string $startTimeProperty, string $endDateProperty, string $endTimeProperty, string $estimatedProperty, ?string $errorProperty = null): ?array
    {
        $start = $this->scheduleDate($this->{$startDateProperty}, $this->{$startTimeProperty});
        $end = $this->scheduleDate($this->{$endDateProperty}, $this->{$endTimeProperty});
        $errorProperty ??= $endDateProperty;
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

    private function scheduleDate(?string $date, ?string $time = null): ?Carbon
    {
        if (! filled($date)) {
            return null;
        }

        return Carbon::parse(str_contains($date, 'T') ? $date : $date.' '.($time ?: '00:00'));
    }

    private function setScheduleDate(string $dateProperty, string $timeProperty, Carbon $date): void
    {
        $this->{$dateProperty} = $date->format('Y-m-d');
        $this->{$timeProperty} = $date->format('H:i');
    }

    private function sizeFromMinutes(int $minutes): string
    {
        return match (true) {
            $minutes < 30 => 'XS',
            $minutes < 60 => 'S',
            $minutes < 120 => 'M',
            $minutes < 240 => 'L',
            default => 'XL',
        };
    }
}
