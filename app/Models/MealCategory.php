<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MealCategory extends Model
{
    use BelongsToUser, HasUuids, \App\Models\Traits\HasCategoryHierarchy;

    protected $fillable = ['parent_id', 'key', 'name', 'normalized_name'];

    public static function options(): array
    {
        return auth()->id() ? static::hierarchyOptions(auth()->id()) : [];
    }
}
