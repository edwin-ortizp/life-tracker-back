<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = [
        'goal_id',
        'task_code',
        'title',
        'description',
        'completed',
        'category',
        'priority',
        'size',
        'start_date',
        'end_date',
        'is_recurrent',
        'is_private',
        'recurrence',
        'progress',
        'elapsed_seconds',
        'timer_start_time',
        'timer_paused',
        'paused_duration',
        'timer_active',
        'estimated_time',
    ];

    protected function casts(): array
    {
        return [
            'completed' => 'boolean',
            'is_recurrent' => 'boolean',
            'is_private' => 'boolean',
            'timer_paused' => 'boolean',
            'timer_active' => 'boolean',
            'recurrence' => 'array',
            'timer_start_time' => 'array',
            'start_date' => 'datetime',
            'end_date' => 'datetime',
        ];
    }

    public function goal()
    {
        return $this->belongsTo(Goal::class);
    }
}
