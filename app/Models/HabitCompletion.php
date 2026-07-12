<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Model;

class HabitCompletion extends Model
{
    use BelongsToUser;

    protected $fillable = [
        'habit_id',
        'date',
        'completed',
    ];

    protected function casts(): array
    {
        return [
            'completed' => 'boolean',
            'date' => 'date',
        ];
    }

    public function habitDefinition()
    {
        return $this->belongsTo(HabitDefinition::class, 'habit_id');
    }
}
