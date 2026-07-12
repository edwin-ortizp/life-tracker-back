<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class GoalEntry extends Model
{
    use HasUuids;

    protected $fillable = [
        'goal_id',
        'text',
        'date',
        'is_milestone',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'is_milestone' => 'boolean',
        ];
    }

    public function goal()
    {
        return $this->belongsTo(Goal::class);
    }
}
