<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Relation;
use InvalidArgumentException;

class TaskAssociation extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = [
        'task_id',
        'target_type',
        'target_id',
    ];

    protected static function booted(): void
    {
        static::creating(fn (self $association) => $association->ensureConsistentOwnership());
        static::updating(fn (self $association) => $association->ensureConsistentOwnership());
    }

    /** Create or retrieve a validated link between a task and a supported resource. */
    public static function link(Task $task, Model $target): self
    {
        $targetType = array_search($target::class, Relation::morphMap() ?: [], true);

        if ($targetType === false) {
            throw new InvalidArgumentException('El tipo de recurso no está habilitado para asociarse a tareas.');
        }

        $attributes = [
            'user_id' => $task->user_id,
            'task_id' => $task->id,
            'target_type' => $targetType,
            'target_id' => $target->getKey(),
        ];

        $association = static::withoutGlobalScopes()->firstWhere($attributes);

        if ($association) {
            return $association;
        }

        $association = new static([
            'task_id' => $task->id,
            'target_type' => $targetType,
            'target_id' => $target->getKey(),
        ]);
        $association->user_id = $task->user_id;
        $association->save();

        return $association;
    }

    public static function unlink(Task $task, Model $target): int
    {
        $targetType = array_search($target::class, Relation::morphMap() ?: [], true);

        if ($targetType === false) {
            throw new InvalidArgumentException('El tipo de recurso no está habilitado para asociarse a tareas.');
        }

        return static::query()
            ->where('task_id', $task->id)
            ->where('target_type', $targetType)
            ->where('target_id', $target->getKey())
            ->delete();
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function target(): MorphTo
    {
        return $this->morphTo();
    }

    private function ensureConsistentOwnership(): void
    {
        $targetClass = Relation::getMorphedModel($this->target_type);

        if (!$targetClass || !is_a($targetClass, Model::class, true)) {
            throw new InvalidArgumentException('El tipo de recurso no está habilitado para asociarse a tareas.');
        }

        $taskBelongsToUser = Task::withoutGlobalScopes()
            ->whereKey($this->task_id)
            ->where('user_id', $this->user_id)
            ->exists();

        $targetBelongsToUser = $targetClass::withoutGlobalScopes()
            ->whereKey($this->target_id)
            ->where('user_id', $this->user_id)
            ->exists();

        if (!$taskBelongsToUser || !$targetBelongsToUser) {
            throw new InvalidArgumentException('La tarea y el recurso asociado deben pertenecer al mismo usuario.');
        }
    }
}
