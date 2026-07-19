<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Task extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = [
        'task_code',
        'title',
        'description',
        'completed',
        'completed_at',
        'completion_xp',
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
        'flow_position',
    ];

    protected function casts(): array
    {
        return [
            'completed' => 'boolean',
            'completed_at' => 'datetime',
            'completion_xp' => 'integer',
            'is_recurrent' => 'boolean',
            'is_private' => 'boolean',
            'timer_paused' => 'boolean',
            'timer_active' => 'boolean',
            'estimated_time' => 'integer',
            'recurrence' => 'array',
            'timer_start_time' => 'array',
            'start_date' => 'datetime',
            'end_date' => 'datetime',
        ];
    }

    public function getSubtaskProgressAttribute(): ?array
    {
        if (! $this->description) {
            return null;
        }

        preg_match_all('/^[\s]*-\s*\[([ xX])\]/m', $this->description, $matches);

        if (empty($matches[0])) {
            return null;
        }

        $total = count($matches[1]);
        $completed = count(array_filter($matches[1], fn ($m) => strtolower($m) === 'x'));

        return ['completed' => $completed, 'total' => $total];
    }

    public function getEstimatedTimeLabelAttribute(): ?string
    {
        if (! $this->estimated_time) {
            return null;
        }

        $hours = intdiv($this->estimated_time, 60);
        $minutes = $this->estimated_time % 60;

        return $hours ? $hours.' h'.($minutes ? ' '.$minutes.' min' : '') : $minutes.' min';
    }

    protected static function booted(): void
    {
        static::creating(function (self $task): void {
            if ($task->flow_position !== null) {
                return;
            }

            $task->flow_position = static::nextFlowPosition($task->category, $task->user_id);
        });

        static::updating(function (self $task): void {
            if (! $task->isDirty('category')) {
                return;
            }

            $task->flow_position = static::nextFlowPosition($task->category, $task->user_id);
        });

        static::deleting(fn (self $task) => $task->associations()->delete());

        static::updated(function (self $task): void {
            if (! $task->wasChanged(['start_date', 'end_date'])) {
                return;
            }

            $date = $task->start_date ?? $task->end_date;

            if (! $date) {
                return;
            }

            $task->healthEvents()->each(fn (HealthEvent $event) => $event->update(['event_date' => $date->toDateString()]));
        });
    }

    private static function nextFlowPosition(?string $category, ?int $userId): int
    {
        $query = static::query()->where('user_id', $userId);

        if ($category === null) {
            $query->whereNull('category');
        } else {
            $query->where('category', $category);
        }

        return ((int) $query->max('flow_position')) + 1;
    }

    public function associations(): HasMany
    {
        return $this->hasMany(TaskAssociation::class);
    }

    public function goals(): MorphToMany
    {
        return $this->morphedByMany(Goal::class, 'target', 'task_associations', 'task_id', 'target_id')
            ->withTimestamps();
    }

    public function relationships(): MorphToMany
    {
        return $this->morphedByMany(Relationship::class, 'target', 'task_associations', 'task_id', 'target_id')
            ->withTimestamps();
    }

    public function healthEvents(): MorphToMany
    {
        return $this->morphedByMany(HealthEvent::class, 'target', 'task_associations', 'task_id', 'target_id')
            ->withTimestamps();
    }
}
