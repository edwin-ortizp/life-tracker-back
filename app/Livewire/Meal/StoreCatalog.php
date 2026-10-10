<?php

namespace App\Livewire\Meal;

use App\Models\Store;
use App\Services\Meal\CatalogNames;
use Livewire\Attributes\On;
use Livewire\Component;

/**
 * Catálogo de tiendas: el único lugar donde se crean, renombran, unen o eliminan.
 * Los formularios de precios solo eligen tiendas de aquí.
 */
class StoreCatalog extends Component
{
    public bool $open = false;

    public string $newName = '';

    public bool $confirmSimilar = false;

    public ?string $editingId = null;

    public string $editingName = '';

    public ?string $mergingId = null;

    public string $mergeTargetId = '';

    #[On('open-store-catalog')]
    public function show(): void
    {
        $this->reset(['newName', 'confirmSimilar', 'editingId', 'editingName', 'mergingId', 'mergeTargetId']);
        $this->resetValidation();
        $this->open = true;
    }

    public function close(): void
    {
        $this->open = false;
    }

    public function updatedNewName(): void
    {
        $this->confirmSimilar = false;
        $this->resetValidation('newName');
    }

    public function create(): void
    {
        $this->resetValidation('newName');

        try {
            CatalogNames::createStore($this->newName, $this->confirmSimilar);
        } catch (\InvalidArgumentException $e) {
            $this->addError('newName', $e->getMessage());
            // Un nombre parecido se puede confirmar con un segundo clic.
            $this->confirmSimilar = str_starts_with($e->getMessage(), 'Ya hay tiendas parecidas');

            return;
        }

        $this->reset(['newName', 'confirmSimilar']);
        $this->dispatch('stores-updated');
    }

    public function startRename(string $id): void
    {
        $store = Store::find($id);
        $this->editingId = $store?->id;
        $this->editingName = $store?->name ?? '';
        $this->mergingId = null;
        $this->resetValidation();
    }

    public function rename(): void
    {
        $store = Store::find($this->editingId);
        $name = trim($this->editingName);
        if (! $store || $name === '') {
            $this->addError('editingName', 'El nombre de la tienda es obligatorio.');

            return;
        }

        $existing = CatalogNames::findStore($name);
        if ($existing && $existing->id !== $store->id) {
            $this->addError('editingName', "Ya existe \"{$existing->name}\". Si son la misma tienda, únelas.");

            return;
        }

        $store->update(['name' => $name]);
        $this->editingId = null;
        $this->dispatch('stores-updated');
    }

    public function startMerge(string $id): void
    {
        $this->mergingId = $id;
        $this->mergeTargetId = '';
        $this->editingId = null;
        $this->resetValidation();
    }

    public function merge(): void
    {
        $source = Store::find($this->mergingId);
        $target = Store::find($this->mergeTargetId);
        if (! $source || ! $target || $source->is($target)) {
            $this->addError('mergeTargetId', 'Elige la tienda con la que se une.');

            return;
        }

        $source->mergeInto($target);
        $this->mergingId = null;
        $this->dispatch('stores-updated');
    }

    public function delete(string $id): void
    {
        $store = Store::withCount(['prices', 'purchases'])->find($id);
        if ($store && $store->purchases_count > 0) {
            $this->addError('storeName', 'Esta tienda tiene compras registradas; puedes fusionarla con otra.');

            return;
        }
        if ($store && $store->prices_count === 0) {
            $store->delete();
            $this->dispatch('stores-updated');
        }
    }

    public function render()
    {
        return view('livewire.meal.store-catalog', [
            'stores' => $this->open ? Store::withCount('prices')->orderBy('name')->get() : collect(),
        ]);
    }
}
