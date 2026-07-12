<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class RelationshipEvent extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = [
        'relationship_id',
        'title',
        'event_type',
        'event_date',
        'start_date',
        'end_date',
        'is_archived',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'date',
            'start_date' => 'date',
            'end_date' => 'date',
            'is_archived' => 'boolean',
            'archived_at' => 'datetime',
        ];
    }

    public function relationship()
    {
        return $this->belongsTo(Relationship::class);
    }
}
