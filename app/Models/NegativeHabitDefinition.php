<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NegativeHabitDefinition extends Model
{
    protected $fillable = [
        'name',
        'icon',
        'category',
        'description',
    ];
}
