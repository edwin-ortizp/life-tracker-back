<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class NegativeHabitLog extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = [
        'habit_id',
        'timestamp',
        'note',
    ];

    public function negativeHabitDefinition()
    {
        return $this->belongsTo(NegativeHabitDefinition::class, 'habit_id');
    }
}
