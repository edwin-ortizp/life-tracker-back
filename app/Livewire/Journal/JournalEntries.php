<?php

namespace App\Livewire\Journal;

use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Diario')]
class JournalEntries extends Component
{
    public function render()
    {
        return view('livewire.journal.journal-entries');
    }
}
