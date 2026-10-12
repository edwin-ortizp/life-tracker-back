<?php

namespace App\Livewire\Plan;

use Livewire\Attributes\Locked;

class PlanScheduled extends PlanIndex
{
    #[Locked]
    public bool $scheduled = true;

    public function mount(): void
    {
        if (! request()->has('from')) {
            $this->from = today()->toDateString();
        }
        parent::mount();
    }

    public function clearFilters(): void
    {
        parent::clearFilters();
        $this->from = today()->toDateString();
        $this->to = '';
        $this->sort = 'upcoming';
        $this->resetPage();
    }
}
