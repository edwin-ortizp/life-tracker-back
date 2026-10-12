<?php

namespace App\Services\Meal;

use App\Models\Store;
use Illuminate\Validation\ValidationException;

class StoreCatalogManager
{
    public static function rename(string $id, string $name): void
    {
        $store = Store::where('user_id', auth()->id())->findOrFail($id);
        $name = trim($name);
        if ($name === '' || mb_strlen($name) > 255) {
            throw ValidationException::withMessages(['name' => 'Escribe un nombre de hasta 255 caracteres.']);
        }
        $existing = CatalogNames::findStore($name);
        if ($existing && $existing->id !== $store->id) {
            throw ValidationException::withMessages(['name' => 'Ya existe una tienda con ese nombre. Puedes fusionarlas.']);
        }
        $store->update(['name' => $name]);
    }

    public static function delete(string $id): void
    {
        $store = Store::where('user_id', auth()->id())->withCount(['prices', 'purchases'])->findOrFail($id);
        if ($store->prices_count || $store->purchases_count) {
            throw ValidationException::withMessages(['name' => 'Esta tienda tiene precios o compras registrados; puedes fusionarla con otra.']);
        }
        $store->delete();
    }
}
