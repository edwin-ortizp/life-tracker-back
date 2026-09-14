<?php

namespace App\Support;

use App\Models\User;

/**
 * Categorías base de los otros gastos del vehículo (lo que no es combustible ni mantenimiento).
 * Cada cuenta las recibe al registrarse y puede renombrarlas, eliminarlas o agregar las suyas.
 */
class DefaultVehicleExpenseCategories
{
    /** @return list<array{name: string, icon: string}> */
    public static function all(): array
    {
        return [
            ['name' => 'Seguros', 'icon' => 'bi-shield-check'],
            ['name' => 'Llantas', 'icon' => 'bi-vinyl'],
            ['name' => 'Pintura y latonería', 'icon' => 'bi-brush'],
            ['name' => 'Impuestos y trámites', 'icon' => 'bi-file-earmark-text'],
            ['name' => 'Accesorios', 'icon' => 'bi-stars'],
            ['name' => 'Peajes y parqueaderos', 'icon' => 'bi-sign-turn-right'],
            ['name' => 'Otros', 'icon' => 'bi-three-dots'],
        ];
    }

    /**
     * Crea las categorías base que falten en la cuenta. Nunca modifica ni borra las existentes.
     *
     * @return int Categorías creadas.
     */
    public static function createFor(User $user): int
    {
        $existing = $user->vehicleExpenseCategories()->withoutGlobalScopes()->pluck('name')
            ->map(fn (string $name) => mb_strtolower($name))
            ->all();
        $order = (int) $user->vehicleExpenseCategories()->withoutGlobalScopes()->max('sort_order');
        $created = 0;

        foreach (self::all() as $definition) {
            if (in_array(mb_strtolower($definition['name']), $existing, true)) {
                continue;
            }

            $user->vehicleExpenseCategories()->create([...$definition, 'sort_order' => ++$order]);
            $existing[] = mb_strtolower($definition['name']);
            $created++;
        }

        return $created;
    }
}
