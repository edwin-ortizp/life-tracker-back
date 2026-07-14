<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Model;

class NegativeHabitDefinition extends Model
{
    use BelongsToUser;

    protected $fillable = [
        'name',
        'icon',
        'category',
        'description',
    ];
}
