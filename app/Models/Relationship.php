<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

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

    public function circle()
    {
        return $this->belongsTo(Circle::class);
    }

    public function relationshipEvents()
    {
        return $this->hasMany(RelationshipEvent::class);
    }
}
