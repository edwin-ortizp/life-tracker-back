<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use App\Support\ReflectionSteps;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A voluntary, resumable self-observation attached to exactly one mood entry.
 * Every answer is optional and nothing here is generated on the user's behalf.
 */
class MoodReflection extends Model
{
    use BelongsToUser, HasFactory, HasUuids;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_COMPLETED = 'completed';

    protected $fillable = [
        'mood_entry_id',
        'status',
        'current_step',
        'automatic_thought',
        'evidence_for',
        'evidence_against',
        'balanced_perspective',
        'intensity_after',
        'next_step',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'intensity_after' => 'integer',
            'completed_at' => 'datetime',
        ];
    }

    public function moodEntry(): BelongsTo
    {
        return $this->belongsTo(MoodEntry::class);
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /** Answers the user actually provided, in step order and without invented content. */
    public function answeredSteps(): array
    {
        return ReflectionSteps::answered($this);
    }

    public function hasAnyAnswer(): bool
    {
        return $this->answeredSteps() !== [];
    }
}
