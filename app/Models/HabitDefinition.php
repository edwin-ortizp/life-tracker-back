<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Model;

class HabitDefinition extends Model
{
    use BelongsToUser;

    protected $fillable = [
        'name',
        'icon',
        'time_of_day',
        'goal_duration',
        'base_time',
    ];

    public function habitCompletions()
    {
        return $this->hasMany(HabitCompletion::class, 'habit_id');
    }
}
