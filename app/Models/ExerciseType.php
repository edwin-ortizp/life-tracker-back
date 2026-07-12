<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ExerciseType extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = [
        'name',
        'calories_per_hour',
        'steps_equivalent',
        'category',
        'icon',
        'legacy_id',
    ];
}
