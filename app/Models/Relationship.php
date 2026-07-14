<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Relationship extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = [
        'circle_id',
        'full_name',
        'nickname',
        'category',
        'birthday_date',
        'birthday_month',
        'birthday_day',
        'last_contact_at',
        'next_contact_suggested_at',
        'notes',
        'is_archived',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'birthday_date' => 'date',
            'last_contact_at' => 'datetime',
            'next_contact_suggested_at' => 'datetime',
            'archived_at' => 'datetime',
            'notes' => 'array',
            'is_archived' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::deleting(fn (self $relationship) => $relationship->taskAssociations()->delete());
    }

    public function circle()
    {
        return $this->belongsTo(Circle::class);
    }

    public function relationshipEvents()
    {
        return $this->hasMany(RelationshipEvent::class);
    }

    public function taskAssociations(): MorphMany
    {
        return $this->morphMany(TaskAssociation::class, 'target');
    }

    public function tasks(): MorphToMany
    {
        return $this->morphToMany(Task::class, 'target', 'task_associations', 'target_id', 'task_id')
            ->withTimestamps();
    }
}
