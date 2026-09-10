<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RelationshipAlias extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = ['relationship_id', 'alias'];

    public function relationship(): BelongsTo
    {
        return $this->belongsTo(Relationship::class);
    }
}
