<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HabitDefinition extends Model
{
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
