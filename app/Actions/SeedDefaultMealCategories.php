<?php

namespace App\Actions;

use App\Models\ShoppingItem;
use App\Models\User;
use App\Services\Meal\CatalogNames;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class SeedDefaultMealCategories
{
    public static function for(User $user): void
    {
        if (! Schema::hasTable('meal_categories')) {
            return;
        }
        foreach (ShoppingItem::CATEGORIES as $key => $name) {
            DB::table('meal_categories')->insertOrIgnore([
                'id' => (string) Str::uuid(), 'user_id' => $user->id, 'key' => $key,
                'name' => $name, 'normalized_name' => CatalogNames::normalize($name),
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }
    }
}
