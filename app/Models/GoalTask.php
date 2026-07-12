<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class GoalTask extends Model
{
    use HasUuids;

    protected $fillable = [
        'goal_id',
        'title',
        'done',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'done' => 'boolean',
            'completed_at' => 'datetime',
        ];
    }

    public function goal()
    {
        return $this->belongsTo(Goal::class);
    }
}
