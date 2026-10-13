<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class DrinkType extends Model
{
    use \App\Models\Traits\ResolvesCategoryCatalog;

    use BelongsToUser, HasUuids;

    protected $fillable = [
        'name',
        'hydration_factor',
        'color',
        'icon',
        'category',
    ];

    public function logs()
    {
        return $this->hasMany(DrinkLog::class);
    }
}
