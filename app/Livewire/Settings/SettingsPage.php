<?php

namespace App\Livewire\Settings;

use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Ajustes')]
class SettingsPage extends Component
{
    public function render()
    {
        return view('livewire.settings.settings-page');
    }
}
