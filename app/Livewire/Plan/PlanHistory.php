<?php

namespace App\Livewire\Plan;

use App\Livewire\Concerns\WithManagementCard;
use App\Models\PlanVisit;
use App\Models\Relationship;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Locked;
use Livewire\Attributes\Title;
use Livewire\Attributes\Url;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Historial de planes')]
class PlanHistory extends Component
{
    use WithManagementCard;

    #[Url(history: true)]
    public string $q = '';

    #[Url(history: true)]
    public string $from = '';

    #[Url(history: true)]
    public string $to = '';

    #[Url(history: true)]
    public string $sort = 'recent';

    #[Url(history: true)]
    public array $people = [];

    #[Locked]
    public ?string $viewingId = null;

    public bool $visitOpen = false;

    public function updated(): void
    {
        $this->resetPage();
    }

    public function clearFilters(): void
    {
        $this->reset(['q', 'from', 'to', 'people']);
        $this->resetPage();
    }

    public function showVisit(string $id): void
    {
        $this->viewingId = PlanVisit::query()->whereHas('plan')->findOrFail($id)->id;
        $this->visitOpen = true;
    }

    public function closeVisit(): void
    {
        $this->viewingId = null;
        $this->visitOpen = false;
    }

    public function deleteVisit(string $id): void
    {
        PlanVisit::query()->whereHas('plan')->findOrFail($id)->delete();
        if ($this->viewingId === $id) {
            $this->closeVisit();
        }
        $this->resetPage();
    }

    public function render()
    {
        $dates = validator(['from' => $this->from ?: null, 'to' => $this->to ?: null], ['from' => 'nullable|date_format:Y-m-d', 'to' => 'nullable|date_format:Y-m-d|after_or_equal:from']);
        if ($dates->fails()) {
            foreach ($dates->errors()->messages() as $key => $messages) {
                $this->addError($key, $messages[0]);
            }
        } else {
            $this->resetValidation(['from', 'to']);
        }
        $search = trim($this->q);
        $query = PlanVisit::query()->whereHas('plan')->with(['plan', 'relationships'])
            ->when(! $dates->fails() && $this->from !== '', fn ($q) => $q->whereDate('visited_on', '>=', $this->from))
            ->when(! $dates->fails() && $this->to !== '', fn ($q) => $q->whereDate('visited_on', '<=', $this->to))
            ->when($this->people !== [], fn ($q) => $q->whereHas('relationships', fn ($q) => $q->whereKey(array_filter($this->people, 'is_string'))))
            ->when($search !== '', fn ($q) => $q->where(fn ($q) => $q->where('comment', 'like', "%{$search}%")
                ->orWhereHas('plan', fn ($q) => $q->where('title', 'like', "%{$search}%"))
                ->orWhereHas('relationships', fn ($q) => $q->where('full_name', 'like', "%{$search}%")->orWhere('nickname', 'like', "%{$search}%"))))
            ->orderBy('visited_on', $this->sort === 'oldest' ? 'asc' : 'desc')->orderBy('id');

        return view('livewire.plan.plan-history', [
            'visits' => $query->paginate($this->perPage()),
            'selectedVisit' => $this->viewingId ? PlanVisit::query()->whereHas('plan')->with(['plan', 'relationships'])->find($this->viewingId) : null,
            'peopleOptions' => Relationship::query()->orderBy('full_name')->pluck('full_name','id')->all(),
        ]);
    }
}
