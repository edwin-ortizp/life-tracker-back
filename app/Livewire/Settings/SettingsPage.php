<?php

namespace App\Livewire\Settings;

use App\Models\IntegrationToken;
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
    public ?float $currentWeightKg = null;
    public ?int $heightCm = null;
    public ?string $birthDate = null;
    public ?int $lifeExpectancyYears = null;
    public ?string $activityLevel = null;
    public ?int $dailyWaterGoal = null;
    public string $currentPassword = '';
    public string $newPassword = '';
    public string $newPasswordConfirmation = '';
    public string $successMessage = '';
    public ?string $obsidianIntegrationToken = null;

    public function mount()
    {
        $user = Auth::user();
        $this->fullName = $user->full_name ?? $user->name ?? '';
        $this->email = $user->email;
        $this->currentWeightKg = $user->current_weight_kg !== null ? (float) $user->current_weight_kg : null;
        $this->heightCm = $user->height_cm;
        $this->birthDate = $user->birth_date?->toDateString();
        $this->lifeExpectancyYears = $user->life_expectancy_years;
        $this->activityLevel = $user->activity_level;
        $this->dailyWaterGoal = $user->daily_water_goal;
    }

    public function updateProfile()
    {
        $validated = $this->validate([
            'fullName' => ['required', 'string', 'max:255'],
            'currentWeightKg' => ['nullable', 'numeric', 'between:20,500'],
            'heightCm' => ['nullable', 'integer', 'between:50,300'],
            'birthDate' => ['nullable', 'date', 'before_or_equal:today'],
            'lifeExpectancyYears' => ['nullable', 'integer', 'between:1,130'],
            'activityLevel' => ['nullable', 'in:sedentary,light,moderate,high,very_high'],
            'dailyWaterGoal' => ['nullable', 'integer', 'between:500,10000'],
        ]);

        $user = Auth::user();
        $user->update([
            'full_name' => $validated['fullName'],
            'name' => $validated['fullName'],
            'current_weight_kg' => $validated['currentWeightKg'],
            'height_cm' => $validated['heightCm'],
            'birth_date' => $validated['birthDate'],
            'life_expectancy_years' => $validated['lifeExpectancyYears'],
            'activity_level' => $validated['activityLevel'],
            'daily_water_goal' => $validated['dailyWaterGoal'],
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

    public function createOrRotateObsidianToken(): void
    {
        [$integrationToken, $plainTextToken] = IntegrationToken::issueFor(Auth::user(), 'Obsidian / n8n');

        $this->obsidianIntegrationToken = $plainTextToken;
        $this->successMessage = 'Token de integración generado. Cópialo ahora: no volverá a mostrarse.';
    }

    public function revokeObsidianToken(): void
    {
        IntegrationToken::query()
            ->where('user_id', Auth::id())
            ->where('name', 'Obsidian / n8n')
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);

        $this->obsidianIntegrationToken = null;
        $this->successMessage = 'Token de integración revocado.';
    }

    public function hideObsidianToken(): void
    {
        $this->obsidianIntegrationToken = null;
    }

    public function render()
    {
        return view('livewire.settings.settings-page', [
            'activeObsidianToken' => IntegrationToken::query()
                ->where('user_id', Auth::id())
                ->where('name', 'Obsidian / n8n')
                ->whereNull('revoked_at')
                ->latest('created_at')
                ->first(),
        ]);
    }
}
