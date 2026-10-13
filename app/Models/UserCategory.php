<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use App\Models\Traits\HasCategoryHierarchy;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class UserCategory extends Model
{
    use BelongsToUser, HasUuids, HasCategoryHierarchy;

    protected $fillable = ['user_id', 'domain', 'key', 'name', 'normalized_name', 'parent_id'];

    protected static function booted(): void
    {
        static::saving(function (self $category) {
            $category->name = trim($category->name);
            $category->normalized_name = mb_strtolower($category->name);
            if (static::withoutGlobalScopes()->where('user_id', $category->user_id)->where('domain', $category->domain)
                ->where('normalized_name', $category->normalized_name)->when($category->exists, fn ($q) => $q->whereKeyNot($category->id))->exists()) {
                throw \Illuminate\Validation\ValidationException::withMessages(['name' => 'Ya tienes una categoría con ese nombre.']);
            }
        });
        static::deleting(function (self $category) {
            if (\App\Support\CategoryCatalog::inUse($category)) {
                throw \Illuminate\Validation\ValidationException::withMessages(['name' => 'Esta categoría está en uso. Reasigna primero sus registros.']);
            }
        });
    }
}
