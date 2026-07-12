<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class GoalNumericEntry extends Model
{
    use HasUuids;

    protected $fillable = [
        'goal_id',
        'value',
        'date',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'value' => 'decimal:2',
        ];
    }

    public function goal()
    {
        return $this->belongsTo(Goal::class);
    }
}
