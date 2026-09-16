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
        'actionable_type',
        'actionable_id',
    ];

    protected function casts(): array
    {
        return [
            'completed' => 'boolean',
            'date' => 'date',
        ];
    }

    /** El registro que creó la acción asociada, para poder deshacerlo al desmarcar. */
    public function actionable()
    {
        return $this->morphTo();
    }

    public function habitDefinition()
    {
        return $this->belongsTo(HabitDefinition::class, 'habit_id');
    }
}
