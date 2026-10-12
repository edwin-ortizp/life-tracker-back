<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MealCategory extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = ['key', 'name', 'normalized_name'];

    public static function options(): array
    {
        return static::where('user_id', auth()->id())->orderBy('name')->pluck('name', 'id')->all();
    }
}
