<?php

namespace App\Livewire\Relationship;

use App\Models\Circle;
use App\Models\Relationship;
use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Relaciones')]
class RelationshipIndex extends Component
{
    public string $circleFilter = '';
    public bool $showArchived = false;

    // Person form
    public bool $showForm = false;
    public ?string $editingId = null;
    public string $fullName = '';
    public string $nickname = '';
    public string $circleId = '';
    public string $category = '';
    public ?int $birthdayMonth = null;
    public ?int $birthdayDay = null;

    // Circle form
    public bool $showCircleForm = false;
    public string $circleName = '';
    public int $contactFrequencyDays = 30;

    public function openForm(?string $id = null)
    {
        $this->resetForm();

        if ($id) {
            $rel = Relationship::find($id);
            if ($rel) {
                $this->editingId = $id;
                $this->fullName = $rel->full_name;
                $this->nickname = $rel->nickname ?? '';
                $this->circleId = $rel->circle_id ?? '';
                $this->category = $rel->category ?? '';
                $this->birthdayMonth = $rel->birthday_month;
                $this->birthdayDay = $rel->birthday_day;
            }
        }

        $this->showForm = true;
    }

    public function closeForm()
    {
        $this->showForm = false;
        $this->editingId = null;
        $this->resetForm();
    }

    public function save()
    {
        if (empty(trim($this->fullName))) return;

        $data = [
            'full_name' => trim($this->fullName),
            'nickname' => $this->nickname ?: null,
            'circle_id' => $this->circleId ?: null,
            'category' => $this->category ?: null,
            'birthday_month' => $this->birthdayMonth,
            'birthday_day' => $this->birthdayDay,
        ];

        if ($this->editingId) {
            Relationship::where('id', $this->editingId)->update($data);
        } else {
            Relationship::create($data);
        }

        $this->closeForm();
    }

    public function toggleArchive(string $id)
    {
        $rel = Relationship::find($id);
        if ($rel) {
            $rel->update([
                'is_archived' => !$rel->is_archived,
                'archived_at' => !$rel->is_archived ? now() : null,
            ]);
        }
    }

    public function markContact(string $id)
    {
        Relationship::where('id', $id)->update(['last_contact_at' => now()]);
    }

    public function delete(string $id)
    {
        Relationship::where('id', $id)->delete();
    }

    public function openCircleForm()
    {
        $this->circleName = '';
        $this->contactFrequencyDays = 30;
        $this->showCircleForm = true;
    }

    public function closeCircleForm()
    {
        $this->showCircleForm = false;
    }

    public function saveCircle()
    {
        if (empty(trim($this->circleName))) return;

        Circle::create([
            'name' => trim($this->circleName),
            'contact_frequency_days' => $this->contactFrequencyDays,
        ]);

        $this->closeCircleForm();
    }

    private function resetForm()
    {
        $this->fullName = '';
        $this->nickname = '';
        $this->circleId = '';
        $this->category = '';
        $this->birthdayMonth = null;
        $this->birthdayDay = null;
    }

    public function render()
    {
        $circles = Circle::orderBy('sort_order')->orderBy('name')->get();

        $query = Relationship::with('circle');

        if (!$this->showArchived) {
            $query->where(function ($q) {
                $q->where('is_archived', false)->orWhereNull('is_archived');
            });
        }

        if ($this->circleFilter) {
            $query->where('circle_id', $this->circleFilter);
        }

        $relationships = $query->orderBy('full_name')->get();
        $totalCount = Relationship::where(function ($q) {
            $q->where('is_archived', false)->orWhereNull('is_archived');
        })->count();

        return view('livewire.relationship.relationship-index', [
            'circles' => $circles,
            'relationships' => $relationships,
            'totalCount' => $totalCount,
        ]);
    }
}
