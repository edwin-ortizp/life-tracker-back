<?php

namespace App\Livewire\Plan;

use App\Livewire\Plan\Concerns\ManagesPlanDialogs;
use App\Models\Circle;
use App\Models\Plan;
use App\Models\PlanLink;
use App\Models\Relationship;
use App\Support\Ui\DataState;
use Illuminate\Database\Eloquent\Builder;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Attributes\Url;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Planes')]
class PlanIndex extends Component
{
    use ManagesPlanDialogs;

    public const SORTS = [
        'recent' => 'Más recientes',
        'stale' => 'Hace más tiempo sin ir',
        'popular' => 'Más visitados',
        'upcoming' => 'Fecha próxima',
        'name' => 'Nombre',
    ];

    #[Url(as: 'group', history: true, keep: true)]
    public string $group = '';

    #[Url(as: 'status', history: true, keep: true)]
    public string $status = '';

    #[Url(as: 'q', history: true, keep: true)]
    public string $q = '';

    #[Url(as: 'sort', history: true, keep: true)]
    public string $sort = 'recent';

    #[Url(as: 'city', history: true, keep: true)]
    public string $city = '';

    #[Url(as: 'types', history: true, keep: true)]
    public array $types = [];

    #[Url(as: 'circles', history: true, keep: true)]
    public array $circles = [];

    #[Url(as: 'people', history: true, keep: true)]
    public array $people = [];

    public ?string $surpriseMessage = null;

    public function mount(): void
    {
        $this->normalizeFilters();

        if (request()->boolean('new')) {
            $this->openPlanForm();
        }
    }

    public function updated(string $property): void
    {
        $this->surpriseMessage = null;
        $this->normalizeFilters();
    }

    public function setGroup(string $group): void
    {
        $this->group = array_key_exists($group, Plan::GROUPS) ? $group : '';
        $this->surpriseMessage = null;
    }

    public function removeFilter(string $key, ?string $value = null): void
    {
        if (in_array($key, ['types', 'circles', 'people'], true)) {
            $this->{$key} = array_values(array_diff($this->{$key}, [$value]));
        } elseif (in_array($key, ['status', 'city', 'q'], true)) {
            $this->{$key} = '';
        }
    }

    public function clearFilters(): void
    {
        $this->reset(['group', 'status', 'q', 'city', 'types', 'circles', 'people', 'surpriseMessage']);
    }

    public function surprise(): void
    {
        $this->surpriseFrom($this->filteredQuery());
    }

    public function render()
    {
        $active = Plan::query()->where('status', '!=', 'archived');
        $total = (clone $active)->count();
        $typeCounts = (clone $active)->selectRaw('type, count(*) as total')->groupBy('type')->pluck('total', 'type');
        $statusCounts = Plan::query()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

        $plans = $this->sortPlans(
            $this->filteredQuery()->withVisitStats()->with(['circles', 'relationships', 'images'])->get(),
            $this->sort,
        );

        $stale = $this->sortPlans(
            (clone $active)->has('visits')->withVisitStats()->get(),
            'stale',
        )->take(3);

        $options = $this->planDialogOptions();

        return view('livewire.plan.plan-index', [
            'plans' => $plans,
            'total' => $total,
            'dataState' => DataState::resolve($plans->count(), $total),
            'groups' => collect(Plan::GROUPS)->map(fn (array $group) => $group + ['count' => collect($group['types'])->sum(fn ($type) => $typeCounts[$type] ?? 0)]),
            'statusCounts' => $statusCounts,
            'sorts' => self::SORTS,
            'statusOptions' => Plan::STATUSES,
            'cityOptions' => Plan::query()->whereNotNull('city')->distinct()->orderBy('city')->pluck('city', 'city')->all(),
            'activeFilters' => $this->activeFilters($options),
            'upcoming' => Plan::query()
                ->whereIn('status', ['pending', 'scheduled'])
                ->whereDate('scheduled_on', '>=', today())
                ->orderBy('scheduled_on')
                ->limit(3)
                ->get(),
            'stale' => $stale,
            'recentLinks' => PlanLink::query()->whereHas('plan')->with('plan')->latest()->limit(3)->get(),
        ] + $options);
    }

    private function filteredQuery(): Builder
    {
        $search = trim($this->q);

        return Plan::query()
            ->when($this->status === '', fn (Builder $query) => $query->where('status', '!=', 'archived'), fn (Builder $query) => $query->where('status', $this->status))
            ->when($this->group !== '', fn (Builder $query) => $query->whereIn('type', Plan::GROUPS[$this->group]['types']))
            ->when($this->types !== [], fn (Builder $query) => $query->whereIn('type', $this->types))
            ->when($this->city !== '', fn (Builder $query) => $query->where('city', $this->city))
            ->when($this->circles !== [], fn (Builder $query) => $query->whereHas('circles', fn (Builder $circles) => $circles->whereKey($this->circles)))
            ->when($this->people !== [], fn (Builder $query) => $query->whereHas('relationships', fn (Builder $people) => $people->whereKey($this->people)))
            ->when($search !== '', fn (Builder $query) => $query->where(fn (Builder $match) => $match
                ->where('title', 'like', "%{$search}%")
                ->orWhere('city', 'like', "%{$search}%")
                ->orWhere('category', 'like', "%{$search}%")));
    }

    private function activeFilters(array $options): array
    {
        $filters = [];

        if ($this->status !== '') {
            $filters[] = ['key' => 'status', 'value' => $this->status, 'label' => Plan::STATUSES[$this->status], 'icon' => 'bi-flag'];
        }
        if ($this->city !== '') {
            $filters[] = ['key' => 'city', 'value' => $this->city, 'label' => $this->city, 'icon' => 'bi-geo-alt'];
        }
        foreach ($this->types as $type) {
            $filters[] = ['key' => 'types', 'value' => $type, 'label' => Plan::TYPES[$type], 'icon' => 'bi-tag'];
        }
        foreach ($this->circles as $circle) {
            $filters[] = ['key' => 'circles', 'value' => $circle, 'label' => $options['circleOptions'][$circle] ?? 'Círculo', 'icon' => 'bi-diagram-3'];
        }
        foreach ($this->people as $person) {
            $filters[] = ['key' => 'people', 'value' => $person, 'label' => $options['peopleOptions'][$person] ?? 'Persona', 'icon' => 'bi-person'];
        }

        return $filters;
    }

    private function normalizeFilters(): void
    {
        $this->group = array_key_exists($this->group, Plan::GROUPS) ? $this->group : '';
        $this->status = array_key_exists($this->status, Plan::STATUSES) ? $this->status : '';
        $this->sort = array_key_exists($this->sort, self::SORTS) ? $this->sort : 'recent';
        $this->types = array_values(array_intersect(array_filter($this->types, 'is_string'), array_keys(Plan::TYPES)));
        $this->circles = array_values(array_filter($this->circles, 'is_string'));
        $this->people = array_values(array_filter($this->people, 'is_string'));
    }
}
