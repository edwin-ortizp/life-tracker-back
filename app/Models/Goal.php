<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Goal extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = [
        'title',
        'description',
        'status',
        'start_date',
        'due_date',
        'positive_count',
        'negative_count',
        'numeric_goal',
    ];

    protected function casts(): array
    {
        return [
            'numeric_goal' => 'array',
            'start_date' => 'date',
            'due_date' => 'date',
        ];
    }

    public function goalTasks()
    {
        return $this->hasMany(GoalTask::class);
    }

    public function goalEntries()
    {
        return $this->hasMany(GoalEntry::class);
    }

    public function goalNumericEntries()
    {
        return $this->hasMany(GoalNumericEntry::class);
    }
}
