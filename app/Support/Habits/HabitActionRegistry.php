<?php

namespace App\Support\Habits;

use Illuminate\Support\Collection;

/**
 * Catálogo de acciones disponibles al completar un hábito.
 *
 * Se resuelve desde el contenedor, así cada acción puede pedir sus dependencias
 * por constructor igual que cualquier otra clase de la app.
 */
class HabitActionRegistry
{
    /** @param array<int, class-string<HabitAction>> $actions */
    public function __construct(private readonly array $actions = []) {}

    /** @return Collection<string, HabitAction> Indexada por clave de acción. */
    public function all(): Collection
    {
        return collect($this->actions)
            ->mapWithKeys(fn (string $class) => [$class::key() => app($class)]);
    }

    public function find(?string $key): ?HabitAction
    {
        if (! $key) {
            return null;
        }

        $class = collect($this->actions)->first(fn (string $candidate) => $candidate::key() === $key);

        return $class ? app($class) : null;
    }

    public function has(string $key): bool
    {
        return $this->find($key) !== null;
    }

    /** @return array<int, string> Claves válidas, para reglas Rule::in(...). */
    public function keys(): array
    {
        return array_map(fn (string $class) => $class::key(), $this->actions);
    }

    /**
     * Acciones agrupadas por etiqueta de módulo, en la forma que espera el
     * componente x-ui.select para generar <optgroup>.
     *
     * @return array<string, array<string, string>>
     */
    public function grouped(): array
    {
        return $this->all()
            // preserveKeys: el <optgroup> necesita la clave de acción como value.
            ->groupBy(fn (HabitAction $action) => $action::moduleLabel(), true)
            ->map(fn (Collection $group) => $group->map(fn (HabitAction $action) => $action::label())->all())
            ->all();
    }
}
