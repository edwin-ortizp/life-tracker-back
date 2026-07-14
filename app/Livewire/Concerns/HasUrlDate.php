<?php

namespace App\Livewire\Concerns;

use Carbon\Carbon;
use Livewire\Attributes\Url;

trait HasUrlDate
{
    #[Url(as: 'date', history: true, keep: true)]
    public string $selectedDate = '';

    protected function initializeSelectedDate(): void
    {
        $this->selectedDate = $this->normalizeUrlDate($this->selectedDate);
    }

    public function updatedSelectedDate(): void
    {
        $normalizedDate = $this->normalizeUrlDate($this->selectedDate);

        if ($this->selectedDate !== $normalizedDate) {
            $this->selectedDate = $normalizedDate;
        }
    }

    private function normalizeUrlDate(string $date): string
    {
        try {
            $parsedDate = Carbon::createFromFormat('!Y-m-d', $date);

            if ($parsedDate && $parsedDate->format('Y-m-d') === $date) {
                return $parsedDate->toDateString();
            }
        } catch (\Throwable) {
            // Invalid query-string dates deliberately fall back to today.
        }

        return now()->toDateString();
    }
}
