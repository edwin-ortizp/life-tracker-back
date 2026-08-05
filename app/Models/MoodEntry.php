<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use InvalidArgumentException;

class MoodEntry extends Model
{
    use BelongsToUser, HasFactory, HasUuids;

    protected $fillable = [
        'date',
        'emoji',
        'text',
        'value',
        'intensity',
        'situation',
        'time',
        'timestamp',
        'mood_state_id',
        'source',
        'source_key',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'intensity' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::deleting(function (self $entry): void {
            $entry->reflection()->delete();
            $entry->relationships()->detach();
        });
    }

    public function moodState(): BelongsTo
    {
        return $this->belongsTo(MoodState::class);
    }

    public function reflection(): HasOne
    {
        return $this->hasOne(MoodReflection::class);
    }

    public function relationships(): BelongsToMany
    {
        return $this->belongsToMany(
            Relationship::class,
            'mood_entry_relationship',
            'mood_entry_id',
            'relationship_id'
        )->withTimestamps();
    }

    /** Replace the primary emotion, keeping the context that was already captured. */
    public function applyMoodState(MoodState $state): void
    {
        $this->update([
            'mood_state_id' => $state->id,
            'emoji' => $state->emoji,
            'text' => $state->text,
            'value' => $state->value,
        ]);
    }

    /** Link a relationship, refusing anything that belongs to somebody else. */
    public function linkRelationship(Relationship $relationship): void
    {
        if ($relationship->user_id !== $this->user_id) {
            throw new InvalidArgumentException('La entrada y la relación deben pertenecer al mismo usuario.');
        }

        $this->relationships()->syncWithoutDetaching([
            $relationship->id => ['user_id' => $this->user_id],
        ]);
    }

    public function unlinkRelationship(Relationship $relationship): void
    {
        $this->relationships()->detach($relationship->id);
    }

    /** Replace the whole link set with the relationships the user confirmed. */
    public function syncRelationships(array $relationshipIds): void
    {
        $owned = Relationship::query()->whereKey($relationshipIds)->pluck('id');
        $payload = $owned->mapWithKeys(fn (string $id) => [$id => ['user_id' => $this->user_id]])->all();

        $this->relationships()->sync($payload);
    }

    public function scopeChronological(Builder $query, string $direction = 'desc'): Builder
    {
        return $query->orderBy('date', $direction)->orderBy('timestamp', $direction);
    }

    public function scopeBetweenDates(Builder $query, string $from, string $to): Builder
    {
        return $query->whereBetween('date', [$from, $to]);
    }
}
