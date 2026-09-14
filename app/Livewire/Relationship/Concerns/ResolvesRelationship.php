<?php

namespace App\Livewire\Relationship\Concerns;

use App\Models\Relationship;

/**
 * Vistas del detalle de una persona: se resuelve una sola vez y siempre dentro del usuario actual.
 */
trait ResolvesRelationship
{
    public string $relationshipId;

    public function mount(string $relationship): void
    {
        $this->relationshipId = Relationship::query()->findOrFail($relationship)->id;
    }

    protected function relationship(): Relationship
    {
        return Relationship::query()->findOrFail($this->relationshipId);
    }
}
