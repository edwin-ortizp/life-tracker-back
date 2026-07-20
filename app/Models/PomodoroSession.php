<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PomodoroSession extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = [
        'date',
        'start_time',
        'end_time',
        'duration',
        'completed',
        'description',
        'client_token',
        'locked_by_device_id',
        'locked_at',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'start_time' => 'array',
            'end_time' => 'array',
            'completed' => 'boolean',
            'locked_at' => 'datetime',
        ];
    }
}
