<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class RelationshipTask extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = [
        'relationship_id',
        'task_id',
    ];

    public function relationship()
    {
        return $this->belongsTo(Relationship::class);
    }

    public function task()
    {
        return $this->belongsTo(Task::class);
    }
}
