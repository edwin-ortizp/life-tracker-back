<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MoodState extends Model
{
    use BelongsToUser, HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'emoji',
        'text',
        'value',
        'category',
        'default_key',
        'is_active',
        'is_pinned',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'integer',
            'is_active' => 'boolean',
            'is_pinned' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function entries(): HasMany
    {
        return $this->hasMany(MoodEntry::class);
    }

    /** A default emotion keeps its key even after the user renames it. */
    public function isDefault(): bool
    {
        return $this->default_key !== null;
    }

    /** Whether any entry still points at this emotion, which makes deletion unsafe. */
    public function isUsed(): bool
    {
        return $this->entries()->withoutGlobalScopes()->exists();
    }

    /** Only a custom emotion that was never logged can disappear for good. */
    public function isDeletable(): bool
    {
        return ! $this->isDefault() && ! $this->isUsed();
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /** Pinned first in the order the user chose, then the usual valence ranking. */
    public function scopePrioritized(Builder $query): Builder
    {
        return $query->orderByDesc('is_pinned')
            ->orderBy('sort_order')
            ->orderByDesc('value')
            ->orderBy('text');
    }
}
