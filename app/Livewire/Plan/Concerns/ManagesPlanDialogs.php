<?php

namespace App\Livewire\Plan\Concerns;

use App\Models\Circle;
use App\Models\Plan;
use App\Models\PlanVisit;
use App\Models\Relationship;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Create/edit a plan and record that it was done. Shared by the module list,
 * the plan detail and the Planes tab of a relationship.
 */
trait ManagesPlanDialogs
{
    public bool $showPlanForm = false;

    public ?string $editingPlanId = null;

    public string $planTitle = '';

    public string $planType = 'restaurant';

    public string $planCategory = '';

    public string $planCity = '';

    public string $planAddress = '';

    public ?string $planScheduledOn = null;

    public ?string $planEndsOn = null;

    public string $planNotes = '';

    public array $planCircles = [];

    public array $planPeople = [];

    public array $planLinks = [];

    public bool $showVisitForm = false;

    public ?string $visitPlanId = null;

    public ?string $visitDate = null;

    public array $visitPeople = [];

    public string $visitComment = '';

    /** People preselected when the dialogs open from a relationship. */
    protected function defaultPlanPeople(): array
    {
        return [];
    }

    public function openPlanForm(?string $id = null): void
    {
        $this->resetPlanForm();

        if ($id) {
            $plan = Plan::query()->with(['circles', 'relationships', 'links'])->findOrFail($id);

            $this->editingPlanId = $plan->id;
            $this->planTitle = $plan->title;
            $this->planType = $plan->type;
            $this->planCategory = $plan->category ?? '';
            $this->planCity = $plan->city ?? '';
            $this->planAddress = $plan->address ?? '';
            $this->planScheduledOn = $plan->scheduled_on?->toDateString();
            $this->planEndsOn = $plan->ends_on?->toDateString();
            $this->planNotes = $plan->notes ?? '';
            $this->planCircles = $plan->circles->pluck('id')->all();
            $this->planPeople = $plan->relationships->pluck('id')->all();
            $this->planLinks = $plan->links->map(fn ($link) => ['url' => $link->url, 'label' => $link->label ?? ''])->all();
        } else {
            $this->planPeople = $this->defaultPlanPeople();
        }

        if ($this->planLinks === []) {
            $this->planLinks = [['url' => '', 'label' => '']];
        }

        $this->showPlanForm = true;
    }

    public function closePlanForm(): void
    {
        $this->showPlanForm = false;
        $this->resetPlanForm();
    }

    public function addPlanLink(): void
    {
        $this->planLinks[] = ['url' => '', 'label' => ''];
    }

    public function removePlanLink(int $index): void
    {
        unset($this->planLinks[$index]);
        $this->planLinks = array_values($this->planLinks) ?: [['url' => '', 'label' => '']];
    }

    public function savePlan(): void
    {
        $this->planLinks = collect($this->planLinks)
            ->filter(fn ($link) => trim($link['url'] ?? '') !== '' || trim($link['label'] ?? '') !== '')
            ->values()
            ->all();

        $this->validate([
            'planTitle' => ['required', 'string', 'max:160'],
            'planType' => ['required', Rule::in(array_keys(Plan::TYPES))],
            'planCategory' => ['nullable', 'string', 'max:80'],
            'planCity' => ['nullable', 'string', 'max:120'],
            'planAddress' => ['nullable', 'string', 'max:255'],
            'planScheduledOn' => ['nullable', 'date'],
            'planEndsOn' => ['nullable', 'date', 'after_or_equal:planScheduledOn'],
            'planNotes' => ['nullable', 'string', 'max:2000'],
            'planCircles' => ['array'],
            'planCircles.*' => ['string'],
            'planPeople' => ['array'],
            'planPeople.*' => ['string'],
            'planLinks' => ['array', 'max:10'],
            'planLinks.*.url' => ['required', 'url:http,https', 'max:2048'],
            'planLinks.*.label' => ['nullable', 'string', 'max:120'],
        ], [
            'planLinks.*.url.required' => 'Escribe el enlace o quita la fila.',
            'planLinks.*.url.url' => 'Escribe un enlace válido que empiece por http:// o https://.',
            'planEndsOn.after_or_equal' => 'La fecha final no puede ser anterior a la fecha del plan.',
        ], [
            'planTitle' => 'nombre',
            'planType' => 'tipo',
            'planEndsOn' => 'hasta',
        ]);

        DB::transaction(function (): void {
            $plan = $this->editingPlanId ? Plan::query()->findOrFail($this->editingPlanId) : new Plan;

            $status = $plan->status ?? 'pending';
            if ($this->planScheduledOn && $status === 'pending') {
                $status = 'scheduled';
            } elseif (! $this->planScheduledOn && $status === 'scheduled') {
                $status = 'pending';
            }

            $plan->fill([
                'title' => trim($this->planTitle),
                'type' => $this->planType,
                'category' => trim($this->planCategory) ?: null,
                'city' => trim($this->planCity) ?: null,
                'address' => trim($this->planAddress) ?: null,
                'scheduled_on' => $this->planScheduledOn ?: null,
                'ends_on' => $this->planEndsOn ?: null,
                'notes' => trim($this->planNotes) ?: null,
                'status' => $status,
            ])->save();

            // Global scopes keep only the circles and people of the signed-in user.
            $plan->circles()->sync(Circle::query()->whereKey($this->planCircles)->pluck('id'));
            $plan->relationships()->sync(Relationship::query()->whereKey($this->planPeople)->pluck('id'));

            $plan->links()->delete();
            foreach ($this->planLinks as $link) {
                $plan->links()->create(['url' => trim($link['url']), 'label' => trim($link['label'] ?? '') ?: null]);
            }
        });

        $this->closePlanForm();
    }

    public function openVisitForm(string $planId): void
    {
        $this->resetVisitForm();
        $this->visitPlanId = Plan::query()->findOrFail($planId)->id;
        $this->visitDate = today()->toDateString();
        $this->visitPeople = $this->defaultPlanPeople();
        $this->showVisitForm = true;
    }

    public function closeVisitForm(): void
    {
        $this->showVisitForm = false;
        $this->resetVisitForm();
    }

    public function saveVisit(): void
    {
        $this->validate([
            'visitDate' => ['required', 'date', 'before_or_equal:today'],
            'visitPeople' => ['required', 'array', 'min:1'],
            'visitPeople.*' => ['string'],
            'visitComment' => ['nullable', 'string', 'max:1000'],
        ], [
            'visitPeople.required' => 'Elige al menos una persona.',
            'visitPeople.min' => 'Elige al menos una persona.',
            'visitDate.before_or_equal' => 'La fecha no puede ser futura.',
        ], [
            'visitDate' => 'fecha',
        ]);

        $people = Relationship::query()->whereKey($this->visitPeople)->pluck('id');

        if ($people->isEmpty()) {
            $this->addError('visitPeople', 'Elige al menos una persona.');

            return;
        }

        DB::transaction(function () use ($people): void {
            $plan = Plan::query()->findOrFail($this->visitPlanId);

            $visit = $plan->visits()->create([
                'visited_on' => $this->visitDate,
                'comment' => trim($this->visitComment) ?: null,
            ]);

            $visit->relationships()->sync($people);
            $plan->relationships()->syncWithoutDetaching($people);

            // A dated plan is fulfilled by doing it; open-ended plans stay available to repeat.
            if ($plan->status === 'scheduled') {
                $plan->update(['status' => 'done']);
            }
        });

        $this->closeVisitForm();
    }

    public function deleteVisit(string $id): void
    {
        PlanVisit::query()->findOrFail($id)->delete();
    }

    public function deletePlan(string $id): void
    {
        Plan::query()->findOrFail($id)->delete();
    }

    public function setPlanStatus(string $id, string $status): void
    {
        abort_unless(array_key_exists($status, Plan::STATUSES), 422);

        $plan = Plan::query()->findOrFail($id);
        $plan->update(['status' => $status === 'pending' && $plan->scheduled_on?->isFuture() ? 'scheduled' : $status]);
    }

    /** Sorting is done in memory so "never visited" can go last on every database. */
    protected function sortPlans(Collection $plans, string $sort): Collection
    {
        return match ($sort) {
            'stale' => $plans->sortBy([
                fn ($a, $b) => ($a->last_visited_on === null) <=> ($b->last_visited_on === null),
                fn ($a, $b) => (string) $a->last_visited_on <=> (string) $b->last_visited_on,
            ])->values(),
            'popular' => $plans->sortBy([['visits_count', 'desc'], ['title', 'asc']])->values(),
            'upcoming' => $plans->sortBy([
                fn ($a, $b) => ($a->scheduled_on === null) <=> ($b->scheduled_on === null),
                fn ($a, $b) => (string) $a->scheduled_on?->toDateString() <=> (string) $b->scheduled_on?->toDateString(),
            ])->values(),
            'name' => $plans->sortBy('title', SORT_NATURAL | SORT_FLAG_CASE)->values(),
            default => $plans->sortByDesc('created_at')->values(),
        };
    }

    protected function surpriseFrom(Builder $query): void
    {
        $plan = $query->whereIn('status', ['pending', 'scheduled'])->inRandomOrder()->first();

        if (! $plan) {
            $this->surpriseMessage = 'No hay planes pendientes con estos filtros.';

            return;
        }

        $this->redirectRoute('plans.show', ['plan' => $plan->id], navigate: true);
    }

    protected function planDialogOptions(): array
    {
        return [
            'typeOptions' => Plan::TYPES,
            'circleOptions' => Circle::query()->orderBy('sort_order')->orderBy('name')->pluck('name', 'id')->all(),
            'peopleOptions' => Relationship::query()->active()->orderBy('full_name')->pluck('full_name', 'id')->all(),
        ];
    }

    private function resetPlanForm(): void
    {
        $this->reset(['editingPlanId', 'planTitle', 'planType', 'planCategory', 'planCity', 'planAddress', 'planScheduledOn', 'planEndsOn', 'planNotes', 'planCircles', 'planPeople', 'planLinks']);
        $this->resetValidation();
    }

    private function resetVisitForm(): void
    {
        $this->reset(['visitPlanId', 'visitDate', 'visitPeople', 'visitComment']);
        $this->resetValidation();
    }
}
