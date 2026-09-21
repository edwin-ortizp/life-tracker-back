<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Task extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = [
        'task_code',
        'caldav_uid',
        'caldav_uri',
        'caldav_data',
        'caldav_revision',
        'title',
        'description',
        'external_refs',
        'completed',
        'completed_at',
        'completion_xp',
        'category',
        'priority',
        'size',
        'start_date',
        'start_is_date',
        'end_date',
        'end_is_date',
        'is_recurrent',
        'is_private',
        'recurrence',
        'recurrence_series_id',
        'is_recurrence_history',
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
            'external_refs' => 'array',
            'caldav_revision' => 'integer',
            'start_is_date' => 'boolean',
            'end_is_date' => 'boolean',
            'is_recurrence_history' => 'boolean',
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

    /**
     * Normaliza una referencia externa: provider/type en minúsculas y, para Jira, la clave en mayúsculas.
     *
     * @return array{provider: string, type: string, id: string, url?: string, label?: string}
     */
    public static function normalizeExternalRef(array $ref): array
    {
        $provider = mb_strtolower(trim((string) ($ref['provider'] ?? '')));
        $id = trim((string) ($ref['id'] ?? ''));

        return array_filter([
            'provider' => $provider,
            'type' => mb_strtolower(trim((string) ($ref['type'] ?? ''))),
            'id' => $provider === 'jira' ? mb_strtoupper($id) : $id,
            'url' => filled($ref['url'] ?? null) ? trim($ref['url']) : null,
            'label' => filled($ref['label'] ?? null) ? trim($ref['label']) : null,
        ], fn ($value) => $value !== null);
    }

    /** Añade y quita referencias externas sin duplicar la combinación provider+type+id. */
    public function mergeExternalRefs(array $add = [], array $remove = []): ?array
    {
        $key = fn (array $ref) => $ref['provider'].'|'.$ref['type'].'|'.mb_strtolower($ref['id']);
        $refs = collect($this->external_refs ?? [])->keyBy($key);

        foreach ($remove as $ref) {
            $refs->forget($key(static::normalizeExternalRef($ref)));
        }

        foreach ($add as $ref) {
            $ref = static::normalizeExternalRef($ref);
            $refs->put($key($ref), [...($refs->get($key($ref)) ?? []), ...$ref]);
        }

        return $refs->isEmpty() ? null : $refs->values()->all();
    }

    /** Filtra tareas que tengan una referencia externa con ese id (y opcionalmente proveedor). */
    public function scopeWithExternalRef(Builder $query, string $id, ?string $provider = null): Builder
    {
        $id = trim($id);
        // Prefiltro portable (MySQL y SQLite) por texto; la coincidencia exacta se valida después.
        $query->where('external_refs', 'like', '%'.addcslashes($id, '%_').'%');

        if ($provider) {
            $query->where('external_refs', 'like', '%'.addcslashes(mb_strtolower($provider), '%_').'%');
        }

        return $query;
    }

    public function hasExternalRef(string $id, ?string $provider = null): bool
    {
        return collect($this->external_refs ?? [])->contains(fn ($ref) =>
            mb_strtolower($ref['id'] ?? '') === mb_strtolower(trim($id))
            && (! $provider || ($ref['provider'] ?? null) === mb_strtolower($provider)));
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

    public function scopeChronological(Builder $query): Builder
    {
        return $query
            ->orderByRaw('CASE WHEN COALESCE(start_date, end_date) IS NULL THEN 1 ELSE 0 END')
            ->orderByRaw('COALESCE(start_date, end_date) ASC')
            ->orderByRaw("CASE WHEN priority = 'urgent-important' THEN 1 WHEN priority = 'not-urgent-important' THEN 2 WHEN priority = 'urgent-not-important' THEN 3 ELSE 4 END")
            ->orderByDesc('created_at');
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
