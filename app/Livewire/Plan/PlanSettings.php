<?php

namespace App\Livewire\Plan;

use App\Models\PlanTag;
use Illuminate\Validation\Rule;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Ajustes de planes')]
class PlanSettings extends Component
{
    public const ICONS = [
        'bi-tag' => 'Etiqueta', 'bi-egg-fried' => 'Comida', 'bi-cup-straw' => 'Postres', 'bi-basket' => 'Canasta',
        'bi-heart' => 'Corazón', 'bi-star' => 'Estrella', 'bi-fire' => 'Fuego', 'bi-leaf' => 'Hoja',
        'bi-globe-americas' => 'Mundo', 'bi-music-note-beamed' => 'Música', 'bi-camera' => 'Cámara',
        'bi-water' => 'Agua', 'bi-emoji-smile' => 'Sonrisa', 'bi-cup-hot' => 'Café', 'bi-bookmark' => 'Marcador',
    ];

    public bool $showForm = false;
    public ?string $editingId = null;
    public string $name = '';
    public string $icon = 'bi-tag';
    public string $message = '';

    public function openForm(?string $id = null): void
    {
        $this->resetValidation();
        $this->message = '';
        $this->editingId = null;
        $this->name = '';
        $this->icon = 'bi-tag';

        if ($id) {
            $tag = PlanTag::query()->findOrFail($id);
            $this->editingId = $tag->id;
            $this->name = $tag->name;
            $this->icon = $tag->icon;
        }

        $this->showForm = true;
    }

    public function closeForm(): void
    {
        $this->showForm = false;
        $this->editingId = null;
        $this->resetValidation();
    }

    public function save(): void
    {
        $this->name = trim($this->name);
        $this->validate([
            'name' => ['required', 'string', 'max:60', Rule::unique('plan_tags', 'name')->where('user_id', auth()->id())->ignore($this->editingId)],
            'icon' => ['required', Rule::in(array_keys(self::ICONS))],
        ], ['name.unique' => 'Ya tienes una etiqueta con ese nombre.'], ['name' => 'nombre', 'icon' => 'icono']);

        $tag = $this->editingId ? PlanTag::query()->findOrFail($this->editingId) : new PlanTag;
        $tag->fill(['name' => $this->name, 'icon' => $this->icon]);
        $tag->save();
        $this->message = $this->editingId ? 'Etiqueta actualizada.' : 'Etiqueta creada.';
        $this->closeForm();
    }

    public function delete(string $id): void
    {
        $tag = PlanTag::query()->withCount('plans')->findOrFail($id);
        if ($tag->plans_count > 0) {
            $this->message = "No se puede eliminar «{$tag->name}»: está asociada a {$tag->plans_count} ".($tag->plans_count === 1 ? 'plan.' : 'planes.');

            return;
        }

        $tag->delete();
        $this->message = "Etiqueta «{$tag->name}» eliminada.";
    }

    public function render()
    {
        return view('livewire.plan.plan-settings', [
            'tags' => PlanTag::query()->withCount('plans')->orderBy('name')->get(),
            'icons' => self::ICONS,
        ]);
    }
}
