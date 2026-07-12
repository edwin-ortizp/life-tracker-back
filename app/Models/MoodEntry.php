<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MoodEntry extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = [
        'date',
        'emoji',
        'text',
        'value',
        'time',
        'timestamp',
        'mood_state_id',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    public function moodState()
    {
        return $this->belongsTo(MoodState::class);
    }
}
