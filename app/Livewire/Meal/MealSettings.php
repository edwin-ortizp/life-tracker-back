<?php

namespace App\Livewire\Meal;

use App\Livewire\Concerns\WithManagementCard;
use App\Models\MealCategory;
use App\Models\ShoppingItem;
use App\Models\Store;
use App\Services\Meal\CatalogNames;
use App\Services\Meal\StoreCatalogManager;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Locked;
use Livewire\Attributes\Title;
use Livewire\Attributes\Url;
use Livewire\Component;

#[Layout('layouts.app')]
#[Title('Ajustes de Comidas')]
class MealSettings extends Component
{
    use WithManagementCard;

    #[Locked]
    public string $section = 'stores';

    #[Url(as: 'q')]
    public string $search = '';

    public bool $showForm = false;
    public ?string $editingId = null;
    public string $parent_id = '';

    public string $name = '';
    public bool $confirmSimilar = false;
    public string $message = '';
    public bool $showMerge = false;
    public string $mergeSourceId = '';
    public string $mergeTargetId = '';

    public function mount(string $section = 'stores'): void
    {
        abort_unless(in_array($section, ['stores', 'categories'], true), 404);
        $this->section = $section;
    }

    public function updatedSearch(): void
    {
        $this->resetPage();
    }

    public function updatedName(): void
    {
        $this->confirmSimilar = false;
    }

    public function openForm(?string $id = null): void
    {
        $this->resetValidation();
        $this->parent_id = '';
        $this->reset(['editingId', 'name', 'confirmSimilar', 'message']);
        if ($id) {
            $model = $this->section === 'stores' ? Store::class : MealCategory::class;
            $record = $model::where('user_id', auth()->id())->findOrFail($id);
            $this->editingId = $record->id;
            $this->name = $record->name;
            $this->parent_id = $record->parent_id ?? '';
        }
        $this->showForm = true;
    }

    public function closeForm(): void
    {
        $this->showForm = false;
        $this->resetValidation();
    }

    public function save(): void
    {
        $this->name = trim($this->name);
        $this->validate(['name' => ['required', 'string', 'max:255']]);
        if ($this->section === 'stores') {
            try {
                if ($this->editingId) {
                    StoreCatalogManager::rename($this->editingId, $this->name);
                } else {
                    CatalogNames::createStore($this->name, $this->confirmSimilar);
                }
            } catch (\InvalidArgumentException $exception) {
                $this->addError('name', $exception->getMessage());
                $this->confirmSimilar = str_starts_with($exception->getMessage(), 'Ya hay tiendas parecidas');

                return;
            }
            $this->dispatch('stores-updated');
        } else {
            $normalized = CatalogNames::normalize($this->name);
            if ($normalized === '') {
                $this->addError('name', 'Escribe un nombre válido.');
                return;
            }
            if (MealCategory::where('user_id', auth()->id())->where('normalized_name', $normalized)->when($this->editingId, fn ($q) => $q->where('id', '!=', $this->editingId))->exists()) {
                $this->addError('name', 'Ya existe una categoría con ese nombre.');
                return;
            }
            $category = $this->editingId ? MealCategory::where('user_id', auth()->id())->findOrFail($this->editingId) : new MealCategory;
            if (! $category->exists) {
                $category->key = 'cat_'.Str::uuid();
            }
            $category->fill(['parent_id' => $this->parent_id ?: null, 'name' => $this->name, 'normalized_name' => $normalized])->save();
        }
        $this->message = 'Cambios guardados.';
        $this->closeForm();
    }

    public function delete(string $id): void
    {
        $this->resetValidation();
        if ($this->section === 'stores') {
            try {
                StoreCatalogManager::delete($id);
            } catch (ValidationException $exception) {
                $this->message = $exception->getMessage();
                return;
            }
            $this->dispatch('stores-updated');
        } else {
            $category = MealCategory::where('user_id', auth()->id())->findOrFail($id);
            if ($category->children()->exists()) {
                $this->message = 'Mueve primero las subcategorías antes de eliminar esta categoría.';
                return;
            }
            if (ShoppingItem::where('user_id', auth()->id())->where('category_id', $category->id)->exists()) {
                $this->message = 'Esta categoría tiene ingredientes asociados y no se puede eliminar.';
                return;
            }
            $category->delete();
        }
        $this->message = 'Registro eliminado.';
        $this->resetPage();
    }

    public function openMerge(string $id): void
    {
        abort_unless($this->section === 'stores', 404);
        Store::where('user_id', auth()->id())->findOrFail($id);
        $this->resetValidation();
        $this->mergeSourceId = $id;
        $this->mergeTargetId = '';
        $this->showMerge = true;
    }

    public function closeMerge(): void
    {
        $this->showMerge = false;
        $this->resetValidation();
    }

    public function merge(): void
    {
        abort_unless($this->section === 'stores', 404);
        $this->validate(['mergeTargetId' => ['required', 'different:mergeSourceId', Rule::exists('stores', 'id')->where('user_id', auth()->id())]]);
        $source = Store::where('user_id', auth()->id())->findOrFail($this->mergeSourceId);
        $target = Store::where('user_id', auth()->id())->findOrFail($this->mergeTargetId);
        $source->mergeInto($target);
        $this->showMerge = false;
        $this->message = 'Tiendas fusionadas.';
        $this->dispatch('stores-updated');
    }

    public function render()
    {
        $model = $this->section === 'stores' ? Store::class : MealCategory::class;
        $query = $model::where('user_id', auth()->id())->when($this->search !== '', fn ($q) => $q->where('name', 'like', '%'.$this->search.'%'));
        if ($this->section === 'stores') {
            $query->withCount(['prices', 'purchases']);
        }
        if ($this->section === 'categories') {
            $query->with('parent')->orderByRaw('COALESCE((SELECT parent.name FROM meal_categories AS parent WHERE parent.id = meal_categories.parent_id), name)')->orderByRaw('parent_id IS NOT NULL');
        }
        return view('livewire.meal.meal-settings', [
            'records' => $query->orderBy('name')->paginate($this->perPage()),
            'categoryCounts' => ShoppingItem::where('user_id', auth()->id())->selectRaw('category_id, count(*) as total')->groupBy('category_id')->pluck('total', 'category_id'),
            'storeOptions' => Store::where('user_id', auth()->id())->where('id', '!=', $this->mergeSourceId)->orderBy('name')->pluck('name', 'id')->all(),
        ]);
    }
}
