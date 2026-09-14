<?php

namespace App\Livewire\Relationship;

use App\Livewire\Concerns\WithManagementCard;
use App\Livewire\Relationship\Concerns\ManagesRelationshipEvents;
use App\Livewire\Relationship\Concerns\ResolvesRelationship;
use App\Models\RelationshipEvent;
use App\Support\Relationships\RelationshipHistoryEntries;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Attributes\Url;
use Livewire\Component;

/**
 * Historial completo de una persona como card de gestión: acontecimientos pasados y visitas a planes.
 */
#[Layout('layouts.app')]
#[Title('Historial de la relación')]
class RelationshipHistory extends Component
{
    use ManagesRelationshipEvents;
    use ResolvesRelationship;
    use WithManagementCard;

    #[Url(as: 'q', history: true, except: '')]
    public string $search = '';

    #[Url(as: 'type', history: true, except: '')]
    public string $type = '';

    #[Url(as: 'category', history: true, except: '')]
    public string $category = '';

    #[Url(as: 'archived', history: true, except: false)]
    public bool $archived = false;

    public function updatedSearch(): void
    {
        $this->resetPage();
    }

    public function updatedCategory(): void
    {
        $this->resetPage();
    }

    public function updatedArchived(): void
    {
        $this->resetPage();
    }

    public function setType(string $type): void
    {
        $this->type = array_key_exists($type, RelationshipHistoryEntries::TYPES) ? $type : '';
        $this->resetPage();
    }

    public function clearFilter(string $filter): void
    {
        match ($filter) {
            'type' => $this->type = '',
            'category' => $this->category = '',
            'archived' => $this->archived = false,
            default => null,
        };

        $this->resetPage();
    }

    public function clearFilters(): void
    {
        $this->type = '';
        $this->category = '';
        $this->archived = false;
        $this->resetPage();
    }

    public function render()
    {
        $this->type = array_key_exists($this->type, RelationshipHistoryEntries::TYPES) ? $this->type : '';
        $this->category = array_key_exists($this->category, RelationshipEvent::CATEGORIES) ? $this->category : '';

        $relationship = $this->relationship();
        $entries = RelationshipHistoryEntries::for($relationship, [
            'q' => $this->search,
            'type' => $this->type,
            'category' => $this->category,
            'archived' => $this->archived,
        ]);

        return view('livewire.relationship.relationship-history', [
            'relationship' => $relationship,
            'entries' => $this->paginateCollection($entries),
            'total' => RelationshipHistoryEntries::for($relationship)->count(),
            'typeFilters' => RelationshipHistoryEntries::TYPES,
            'categories' => RelationshipEvent::CATEGORIES,
        ]);
    }
}
