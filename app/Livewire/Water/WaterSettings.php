<?php

namespace App\Livewire\Water;

use App\Models\DrinkLog;
use App\Models\DrinkType;
use Illuminate\Validation\Rule;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Ajustes de hidratación')]
class WaterSettings extends Component
{
    public ?int $dailyWaterGoal = null;
    public ?string $editingId = null;
    public string $name = '';
    public string $icon = '💧';
    public string $hydrationFactor = '1.00';
    public string $message = '';

    public function mount(): void { $this->dailyWaterGoal = auth()->user()->daily_water_goal; }

    public function saveGoal(): void
    {
        $data = $this->validate(['dailyWaterGoal' => ['nullable', 'integer', 'between:500,10000']]);
        auth()->user()->update(['daily_water_goal' => $data['dailyWaterGoal']]);
        $this->message = 'Meta diaria actualizada.';
    }

    public function edit(?string $id = null): void
    {
        $this->resetValidation();
        $this->editingId = null; $this->name = ''; $this->icon = '💧'; $this->hydrationFactor = '1.00';
        if ($id && ($type = DrinkType::find($id))) {
            $this->editingId = $type->id; $this->name = $type->name; $this->icon = $type->icon ?: '💧'; $this->hydrationFactor = (string) $type->hydration_factor;
        }
    }

    public function saveDrinkType(): void
    {
        $type = $this->editingId ? DrinkType::find($this->editingId) : new DrinkType();
        if (! $type) { $this->message = 'La bebida ya no está disponible.'; return; }
        $data = $this->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('drink_types', 'name')->where(fn ($query) => $query->where('user_id', auth()->id()))->ignore($type->id)],
            'icon' => ['required', 'string', 'max:40'],
            'hydrationFactor' => ['required', 'numeric', 'min:0', 'max:9.99'],
        ]);
        $type->fill(['name' => trim($data['name']), 'icon' => trim($data['icon']), 'hydration_factor' => $data['hydrationFactor']])->save();
        $this->message = $this->editingId ? 'Bebida actualizada.' : 'Bebida creada.';
        $this->edit();
    }

    public function deleteDrinkType(string $id): void
    {
        $type = DrinkType::find($id);
        if (! $type) { $this->message = 'La bebida ya no está disponible.'; return; }
        if (DrinkLog::where('drink_type_id', $id)->exists()) { $this->message = 'No se puede eliminar una bebida con registros históricos.'; return; }
        $type->delete(); $this->message = 'Bebida eliminada.';
    }

    public function render() { return view('livewire.water.water-settings', ['drinkTypes' => DrinkType::orderBy('name')->get()]); }
}
