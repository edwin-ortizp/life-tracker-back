<?php

namespace App\Livewire\Relationship;

use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Relaciones')]
class RelationshipIndex extends Component
{
    public function render()
    {
        return view('livewire.relationship.relationship-index');
    }
}
