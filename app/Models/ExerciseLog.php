<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ExerciseLog extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = [
        'date',
        'exercise_id',
        'exercise_type_id',
        'sets',
        'reps',
        'duration',
        'distance',
        'weight',
        'calories',
        'steps',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    public function exerciseType()
    {
        return $this->belongsTo(ExerciseType::class);
    }
}
