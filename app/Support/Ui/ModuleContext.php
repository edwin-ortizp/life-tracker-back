<?php

namespace App\Support\Ui;

use Illuminate\Support\Str;

/**
 * Resuelve el módulo activo a partir de la ruta actual.
 *
 * Las superficies que se teletransportan fuera del shell (modales, FAB) lo usan
 * para conservar `data-module` y, con él, el color de acento del módulo.
 */
class ModuleContext
{
    public static function current(?string $explicit = null): ?string
    {
        if ($explicit) {
            return $explicit;
        }

        $routeName = request()->route()?->getName() ?? '';

        foreach (config('modules', []) as $key => $definition) {
            foreach ($definition['patterns'] ?? [] as $pattern) {
                if (Str::is($pattern, $routeName)) {
                    return $key;
                }
            }
        }

        return null;
    }
}
