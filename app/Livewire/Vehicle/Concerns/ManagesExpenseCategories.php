<?php

namespace App\Livewire\Vehicle\Concerns;

use App\Models\VehicleExpense;
use App\Models\VehicleExpenseCategory;
use App\Support\DefaultVehicleExpenseCategories;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Catálogo personal de categorías de gastos, compartido por todos los vehículos del usuario.
 * Una categoría con gastos no se borra a ciegas: primero sus gastos pasan a otra categoría.
 */
trait ManagesExpenseCategories
{
    public bool $showCategoryManager = false;

    public string $newCategoryName = '';

    public ?string $renamingCategoryId = null;

    public string $renamingCategoryName = '';

    public ?string $deletingCategoryId = null;

    public string $reassignCategoryTo = '';

    public string $categoryMessage = '';

    public function openCategoryManager(): void
    {
        $this->resetCategoryManager();
        $this->showCategoryManager = true;
    }

    public function closeCategoryManager(): void
    {
        $this->showCategoryManager = false;
        $this->resetCategoryManager();
    }

    public function addCategory(): void
    {
        $this->newCategoryName = trim($this->newCategoryName);
        $this->validate(
            ['newCategoryName' => ['required', 'string', 'max:60']],
            [],
            ['newCategoryName' => 'nombre de la categoría'],
        );
        if ($this->categoryNameTaken($this->newCategoryName)) {
            $this->addError('newCategoryName', 'Ya tienes una categoría con ese nombre.');

            return;
        }

        VehicleExpenseCategory::create([
            'name' => $this->newCategoryName,
            'icon' => 'bi-tag',
            'sort_order' => (int) VehicleExpenseCategory::query()->max('sort_order') + 1,
        ]);
        $this->categoryMessage = "«{$this->newCategoryName}» ya está disponible al registrar gastos.";
        $this->newCategoryName = '';
    }

    public function startCategoryRename(string $id): void
    {
        $category = VehicleExpenseCategory::query()->find($id);
        if (! $category) {
            return;
        }
        $this->resetValidation();
        $this->deletingCategoryId = null;
        $this->renamingCategoryId = $category->id;
        $this->renamingCategoryName = $category->name;
    }

    public function cancelCategoryRename(): void
    {
        $this->renamingCategoryId = null;
        $this->renamingCategoryName = '';
        $this->resetValidation('renamingCategoryName');
    }

    public function saveCategoryRename(): void
    {
        $category = $this->renamingCategoryId ? VehicleExpenseCategory::query()->find($this->renamingCategoryId) : null;
        if (! $category) {
            $this->cancelCategoryRename();

            return;
        }
        $this->renamingCategoryName = trim($this->renamingCategoryName);
        $this->validate(
            ['renamingCategoryName' => ['required', 'string', 'max:60']],
            [],
            ['renamingCategoryName' => 'nombre de la categoría'],
        );
        if ($this->categoryNameTaken($this->renamingCategoryName, $category->id)) {
            $this->addError('renamingCategoryName', 'Ya tienes una categoría con ese nombre.');

            return;
        }

        $category->update(['name' => $this->renamingCategoryName]);
        $this->categoryMessage = 'Categoría renombrada. Sus gastos conservan la categoría.';
        $this->cancelCategoryRename();
    }

    /** Sin gastos se elimina directamente; con gastos se pide a qué categoría pasarlos. */
    public function deleteCategory(string $id): void
    {
        $category = VehicleExpenseCategory::query()->withCount('expenses')->find($id);
        if (! $category) {
            return;
        }
        $this->cancelCategoryRename();

        if ($category->expenses_count > 0) {
            $this->deletingCategoryId = $category->id;
            $this->reassignCategoryTo = '';

            return;
        }

        $category->delete();
        $this->categoryMessage = "«{$category->name}» eliminada.";
    }

    public function cancelCategoryDelete(): void
    {
        $this->deletingCategoryId = null;
        $this->reassignCategoryTo = '';
        $this->resetValidation('reassignCategoryTo');
    }

    public function reassignAndDeleteCategory(): void
    {
        $category = $this->deletingCategoryId ? VehicleExpenseCategory::query()->find($this->deletingCategoryId) : null;
        if (! $category) {
            $this->cancelCategoryDelete();

            return;
        }

        $this->validate(
            ['reassignCategoryTo' => ['required', Rule::exists('vehicle_expense_categories', 'id')->where('user_id', auth()->id()), Rule::notIn([$category->id])]],
            ['reassignCategoryTo.required' => 'Elige a qué categoría pasar los gastos.'],
            ['reassignCategoryTo' => 'categoría de destino'],
        );
        $target = VehicleExpenseCategory::query()->findOrFail($this->reassignCategoryTo);

        $moved = DB::transaction(function () use ($category, $target) {
            $moved = VehicleExpense::query()->where('vehicle_expense_category_id', $category->id)->update(['vehicle_expense_category_id' => $target->id]);
            $category->delete();

            return $moved;
        });

        $this->categoryMessage = "«{$category->name}» eliminada. {$moved} ".($moved === 1 ? 'gasto pasó' : 'gastos pasaron')." a «{$target->name}».";
        $this->cancelCategoryDelete();
    }

    public function restoreDefaultCategories(): void
    {
        $created = DefaultVehicleExpenseCategories::createFor(auth()->user());
        $this->categoryMessage = $created === 0
            ? 'Ya tenías todas las categorías predeterminadas.'
            : "Se agregaron {$created} categorías predeterminadas. Tus categorías y gastos siguen intactos.";
    }

    /** Sin distinguir mayúsculas, sea cual sea la collation del motor. */
    private function categoryNameTaken(string $name, ?string $ignoreId = null): bool
    {
        return VehicleExpenseCategory::query()
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
            ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
            ->exists();
    }

    private function resetCategoryManager(): void
    {
        $this->reset('newCategoryName', 'renamingCategoryId', 'renamingCategoryName', 'deletingCategoryId', 'reassignCategoryTo', 'categoryMessage');
        $this->resetValidation();
    }
}
