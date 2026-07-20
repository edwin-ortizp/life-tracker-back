<?php

namespace App\Livewire\Meal;

use App\Models\ShoppingItem;
use App\Services\Meal\IngredientImportService;
use Illuminate\Validation\Rule;
use Livewire\Attributes\Locked;
use Livewire\Component;

class BulkIngredientAssistant extends Component
{
    #[Locked]
    public string $context = 'shopping';

    public bool $show = false;

    public int $step = 1;

    public string $input = '';

    public array $rows = [];

    public ?array $result = null;

    #[Locked]
    public array $categoryOptions = [
        'frutas_verduras' => 'Frutas y verduras',
        'carnes' => 'Carnes y pescados',
        'lacteos' => 'Lácteos y huevos',
        'panaderia' => 'Panadería',
        'cereales' => 'Cereales y granos',
        'enlatados' => 'Enlatados y conservas',
        'condimentos' => 'Condimentos y salsas',
        'bebidas' => 'Bebidas',
        'congelados' => 'Congelados',
        'snacks' => 'Snacks y dulces',
        'limpieza' => 'Limpieza',
        'higiene' => 'Higiene personal',
        'mascotas' => 'Mascotas',
        'otros' => 'Otros',
    ];

    public function mount(string $context = 'shopping'): void
    {
        abort_unless(in_array($context, ['shopping', 'ingredients'], true), 404);
        $this->context = $context;
    }

    public function open(): void
    {
        $this->resetValidation();
        $this->step = 1;
        $this->input = '';
        $this->rows = [];
        $this->result = null;
        $this->show = true;
    }

    public function close(): void
    {
        $this->show = false;
        $this->resetValidation();
    }

    public function analyze(IngredientImportService $importer): void
    {
        $this->validate([
            'input' => ['required', 'string', 'max:10000'],
        ], [
            'input.required' => 'Escribe o dicta al menos un ingrediente.',
            'input.max' => 'La lista es demasiado larga.',
        ]);

        $parsed = $importer->parse($this->input);
        if ($parsed === []) {
            $this->addError('input', 'No encontramos ingredientes válidos en el texto.');

            return;
        }

        $this->rows = $importer->resolve($parsed);
        $this->step = 2;
    }

    public function backToInput(): void
    {
        $this->resetValidation();
        $this->step = 1;
    }

    public function confirm(IngredientImportService $importer): void
    {
        $this->resetValidation();
        $this->validate([
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.action' => ['required', Rule::in(['match', 'create', 'link', 'ignore'])],
            'rows.*.new_name' => ['nullable', 'string', 'max:255'],
            'rows.*.category' => ['nullable', Rule::in(array_keys($this->categoryOptions))],
            'rows.*.unit' => ['nullable', 'string', 'max:50'],
            'rows.*.link_item_id' => ['nullable', 'uuid'],
        ], [
            'rows.*.action.required' => 'Elige qué hacer con este término.',
            'rows.*.action.in' => 'La acción seleccionada no es válida.',
        ]);

        $hasErrors = false;
        foreach ($this->rows as $index => $row) {
            if (($row['status'] ?? '') === 'conflict' && ($row['action'] ?? '') !== 'ignore') {
                $this->addError("rows.$index.action", 'Este conflicto debe ignorarse y corregirse desde el catálogo.');
                $hasErrors = true;
            }
            if (($row['action'] ?? '') === 'create') {
                if (trim((string) ($row['new_name'] ?? '')) === '') {
                    $this->addError("rows.$index.new_name", 'Escribe el nombre del ingrediente.');
                    $hasErrors = true;
                }
                if (trim((string) ($row['category'] ?? '')) === '') {
                    $this->addError("rows.$index.category", 'Selecciona una categoría.');
                    $hasErrors = true;
                }
            }
            if (($row['action'] ?? '') === 'link' && empty($row['link_item_id'])) {
                $this->addError("rows.$index.link_item_id", 'Selecciona el ingrediente que usará este alias.');
                $hasErrors = true;
            }
        }

        if ($hasErrors) {
            return;
        }

        $this->result = $importer->apply($this->rows, $this->context);
        $this->rows = [];
        $this->dispatch('ingredients-imported');
    }

    public function render()
    {
        return view('livewire.meal.bulk-ingredient-assistant', [
            'ingredientOptions' => ShoppingItem::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }
}
