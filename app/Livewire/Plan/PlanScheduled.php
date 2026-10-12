<?php
namespace App\Livewire\Plan;
class PlanScheduled extends PlanIndex
{
    #[\Livewire\Attributes\Locked]
    public bool $scheduled = true;
    public function mount(): void {
        if (! request()->has('from')) $this->from = today()->toDateString();
        parent::mount();
    }
    public function clearFilters(): void { parent::clearFilters(); $this->from = today()->toDateString(); $this->to = ''; $this->sort = 'upcoming'; $this->resetPage(); }
}
