<?php

namespace App\Livewire\Settings;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Livewire\Component;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;

#[Layout('layouts.app')]
#[Title('Ajustes')]
class SettingsPage extends Component
{
    public string $fullName = '';
    public string $email = '';
    public string $currentPassword = '';
    public string $newPassword = '';
    public string $newPasswordConfirmation = '';
    public string $successMessage = '';

    public function mount()
    {
        $user = Auth::user();
        $this->fullName = $user->full_name ?? $user->name ?? '';
        $this->email = $user->email;
    }

    public function updateProfile()
    {
        $user = Auth::user();
        $user->update([
            'full_name' => $this->fullName,
            'name' => $this->fullName,
        ]);
        $this->successMessage = 'Perfil actualizado correctamente.';
    }

    public function updatePassword()
    {
        if (!Hash::check($this->currentPassword, Auth::user()->password)) {
            $this->addError('currentPassword', 'La contraseña actual no es correcta.');
            return;
        }

        if (strlen($this->newPassword) < 8) {
            $this->addError('newPassword', 'La nueva contraseña debe tener al menos 8 caracteres.');
            return;
        }

        if ($this->newPassword !== $this->newPasswordConfirmation) {
            $this->addError('newPasswordConfirmation', 'Las contraseñas no coinciden.');
            return;
        }

        Auth::user()->update([
            'password' => Hash::make($this->newPassword),
        ]);

        $this->currentPassword = '';
        $this->newPassword = '';
        $this->newPasswordConfirmation = '';
        $this->successMessage = 'Contraseña actualizada correctamente.';
    }

    public function render()
    {
        return view('livewire.settings.settings-page');
    }
}
