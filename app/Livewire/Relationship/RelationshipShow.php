<?php

namespace App\Livewire\Relationship;

use App\Livewire\Relationship\Concerns\ManagesRelationshipEvents;
use App\Livewire\Relationship\Concerns\ManagesRelationshipTasks;
use App\Livewire\Relationship\Concerns\ResolvesRelationship;
use App\Models\Relationship;
use App\Support\Relationships\RelationshipAgenda;
use App\Support\Relationships\RelationshipHistoryEntries;
use App\Support\Relationships\RelationshipQuickStats;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

/**
 * Inicio del detalle de una persona: primero lo que hay que gestionar (pendientes y próximos),
 * después lo vivido (historial reciente); los datos y estadísticas quedan en el panel derecho.
 */
#[Layout('layouts.app')]
#[Title('Detalle de la relación')]
class RelationshipShow extends Component
{
    use ManagesRelationshipEvents;
    use ManagesRelationshipTasks;
    use ResolvesRelationship;

    public function markContact(): void
    {
        $this->relationship()->update(['last_contact_at' => now()]);
    }

    public function toggleArchive(): void
    {
        $relationship = $this->relationship();

        $relationship->update([
            'is_archived' => ! $relationship->is_archived,
            'archived_at' => $relationship->is_archived ? null : now(),
        ]);
    }

    public function render()
    {
        $relationship = Relationship::query()
            ->with(['circle', 'tags', 'contactMethods', 'aliases'])
            ->findOrFail($this->relationshipId);

        return view('livewire.relationship.relationship-show', [
            'relationship' => $relationship,
            'birthday' => $relationship->birthday(),
            'agenda' => RelationshipAgenda::upcoming($relationship),
            'recentHistory' => RelationshipHistoryEntries::for($relationship)->take(5),
            'quickStats' => RelationshipQuickStats::for($relationship),
        ]);
    }
}
