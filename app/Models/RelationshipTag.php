<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RelationshipTag extends Model
{
    use BelongsToUser, HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'color',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::deleting(function (self $tag): void {
            $tag->relationships()->detach();
        });
    }

    public function relationships(): BelongsToMany
    {
        return $this->belongsToMany(
            Relationship::class,
            'relationship_tag_assignments',
            'relationship_tag_id',
            'relationship_id'
        )->withTimestamps();
    }
}
