<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use App\Support\EventDate;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class RelationshipEvent extends Model
{
    use BelongsToUser, HasFactory, HasUuids;

    public const CATEGORIES = [
        'milestone' => 'Hito personal',
        'education-work' => 'Educación o trabajo',
        'health' => 'Salud',
        'family' => 'Familia',
        'travel' => 'Viaje',
        'conversation' => 'Conversación',
        'celebration' => 'Celebración',
        'other' => 'Otro',
    ];

    protected $fillable = [
        'relationship_id',
        'title',
        'category',
        'notes',
        'event_type',
        'event_date',
        'starts_on',
        'ends_on',
        'date_precision',
        'is_sensitive',
        'is_archived',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'date',
            'start_date' => 'date',
            'end_date' => 'date',
            'starts_on' => 'date',
            'ends_on' => 'date',
            'is_sensitive' => 'boolean',
            'is_archived' => 'boolean',
            'archived_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        // `event_type` predates categories and is still NOT NULL in the legacy schema.
        static::saving(fn (self $event) => $event->event_type = $event->category ?: 'other');
    }

    public function relationship(): BelongsTo
    {
        return $this->belongsTo(Relationship::class);
    }

    /** Global surfaces never show sensitive entries unless the user asks for them. */
    public function scopeVisibleGlobally(Builder $query, bool $includeSensitive = false): Builder
    {
        return $includeSensitive ? $query : $query->where('is_sensitive', false);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_archived', false);
    }

    public function scopeArchived(Builder $query): Builder
    {
        return $query->where('is_archived', true);
    }

    public function scopeUpcoming(Builder $query, ?Carbon $reference = null): Builder
    {
        return $query->whereDate('ends_on', '>=', ($reference ?? Carbon::today())->toDateString());
    }

    public function scopePast(Builder $query, ?Carbon $reference = null): Builder
    {
        return $query->whereDate('ends_on', '<', ($reference ?? Carbon::today())->toDateString());
    }

    public function scopeChronological(Builder $query, string $direction = 'asc'): Builder
    {
        return $query->orderBy('starts_on', $direction)
            ->orderBy('ends_on', $direction)
            ->orderBy('title');
    }

    public function date(): EventDate
    {
        return EventDate::fromWindow(
            $this->date_precision ?? EventDate::DAY,
            $this->starts_on?->toDateString() ?? $this->event_date?->toDateString(),
            $this->ends_on?->toDateString(),
        );
    }

    public function dateLabel(): string
    {
        return $this->date()->label();
    }

    public function categoryLabel(): string
    {
        return self::CATEGORIES[$this->category] ?? self::CATEGORIES['other'];
    }

    public function isUpcoming(?Carbon $reference = null): bool
    {
        return $this->ends_on !== null
            && $this->ends_on->gte(($reference ?? Carbon::today())->copy()->startOfDay());
    }
}
