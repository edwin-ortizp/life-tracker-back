<?php

namespace App\Livewire\Task;

use App\Actions\ManageTaskCategories;
use App\Models\Task;
use App\Models\TaskCategory;
use App\Support\DefaultTaskCategories;
use Illuminate\Validation\Rule;
use InvalidArgumentException;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Title;
use Livewire\Component;

/**
 * Catálogo personal de categorías de tareas. Renombrar no toca las tareas (guardan el key);
 * eliminar una categoría en uso pide a cuál pasar sus tareas o dejarlas sin categoría.
 */
#[Layout('layouts.app')]
#[Title('Ajustes de tareas')]
class TaskSettings extends Component
{
    public const ICONS = [
        'bi-tag' => 'Etiqueta', 'bi-person' => 'Persona', 'bi-briefcase' => 'Trabajo', 'bi-heart-pulse' => 'Salud',
        'bi-cash-coin' => 'Dinero', 'bi-mortarboard' => 'Estudio', 'bi-house' => 'Hogar', 'bi-people' => 'Social',
        'bi-palette' => 'Creatividad', 'bi-cpu' => 'Tecnología', 'bi-bag' => 'Compras', 'bi-file-earmark-text' => 'Documento',
        'bi-car-front' => 'Vehículo', 'bi-airplane' => 'Viaje', 'bi-star' => 'Estrella', 'bi-three-dots' => 'Otros',
    ];

    public bool $showForm = false;

    public ?string $editingId = null;

    public string $name = '';

    public string $icon = 'bi-tag';

    public ?string $deletingId = null;

    public string $reassignTo = '';

    public string $message = '';

    public function openForm(?string $id = null): void
    {
        $this->resetValidation();
        $this->message = '';
        $this->editingId = null;
        $this->name = '';
        $this->icon = 'bi-tag';

        if ($id && ($category = TaskCategory::find($id))) {
            $this->editingId = $category->id;
            $this->name = $category->name;
            $this->icon = $category->icon ?: 'bi-tag';
        }

        $this->showForm = true;
    }

    public function closeForm(): void
    {
        $this->showForm = false;
        $this->editingId = null;
        $this->resetValidation();
    }

    public function save(ManageTaskCategories $categories): void
    {
        $this->validate([
            'name' => ['required', 'string', 'max:60'],
            'icon' => ['required', Rule::in(array_keys(self::ICONS))],
        ], [], ['name' => 'nombre', 'icon' => 'icono']);

        $category = $this->editingId ? TaskCategory::find($this->editingId) : null;

        try {
            if ($category) {
                $categories->update($category, $this->name, $this->icon);
                $this->message = "“{$category->name}” actualizada. Sus tareas la conservan.";
            } else {
                $category = $categories->create(auth()->user(), $this->name, $this->icon);
                $this->message = "“{$category->name}” ya está disponible al crear tareas.";
            }
        } catch (InvalidArgumentException $exception) {
            $this->addError('name', $exception->getMessage());

            return;
        }

        $this->closeForm();
    }

    public function move(string $id, int $direction, ManageTaskCategories $categories): void
    {
        if ($category = TaskCategory::find($id)) {
            $categories->move($category, $direction);
        }
    }

    /** Sin tareas se elimina directamente (la confirmación la pide la vista); con tareas, se pregunta a dónde moverlas. */
    public function delete(string $id, ManageTaskCategories $categories): void
    {
        $category = TaskCategory::find($id);

        if (! $category) {
            return;
        }

        if (Task::where('category', $category->key)->exists()) {
            $this->resetValidation();
            $this->deletingId = $category->id;
            $this->reassignTo = '';

            return;
        }

        $categories->delete($category);
        $this->message = "“{$category->name}” eliminada.";
    }

    public function cancelDelete(): void
    {
        $this->deletingId = null;
        $this->reassignTo = '';
        $this->resetValidation();
    }

    public function reassignAndDelete(ManageTaskCategories $categories): void
    {
        $category = $this->deletingId ? TaskCategory::find($this->deletingId) : null;

        if (! $category) {
            $this->cancelDelete();

            return;
        }

        $this->validate([
            'reassignTo' => ['nullable', Rule::in(TaskCategory::whereKeyNot($category->id)->pluck('id')->all())],
        ]);

        $target = $this->reassignTo !== '' ? TaskCategory::find($this->reassignTo) : null;
        $moved = $categories->delete($category, $target);

        $this->message = "“{$category->name}” eliminada. {$moved} ".($moved === 1 ? 'tarea pasó' : 'tareas pasaron')
            .($target ? " a “{$target->name}”." : ' a Sin categoría.');
        $this->cancelDelete();
    }

    public function restoreDefaults(): void
    {
        $created = DefaultTaskCategories::createFor(auth()->user());

        $this->message = $created === 0
            ? 'Ya tenías todas las categorías predeterminadas.'
            : "Se agregaron {$created} categorías predeterminadas. Tus categorías y tareas siguen intactas.";
    }

    public function render()
    {
        $counts = Task::query()
            ->where('is_recurrence_history', false)
            ->selectRaw('category, SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending, COUNT(*) as total')
            ->groupBy('category')
            ->get()
            ->keyBy(fn ($row) => (string) $row->category);

        $categories = TaskCategory::query()->orderBy('sort_order')->orderBy('name')->get();
        $deleting = $this->deletingId ? $categories->firstWhere('id', $this->deletingId) : null;

        return view('livewire.task.task-settings', [
            'categoryList' => $categories,
            'counts' => $counts,
            'uncategorized' => $counts[''] ?? null,
            'deleting' => $deleting,
            'deletingCount' => $deleting ? Task::where('category', $deleting->key)->count() : 0,
            'reassignOptions' => $deleting
                ? $categories->reject(fn ($category) => $category->is($deleting))->pluck('name', 'id')->all()
                : [],
            'icons' => self::ICONS,
        ]);
    }
}
