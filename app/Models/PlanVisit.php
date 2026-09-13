<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class PlanVisit extends Model
{
    use BelongsToUser, HasFactory, HasUuids;

    protected $fillable = [
        'plan_id',
        'visited_on',
        'comment',
    ];

    protected function casts(): array
    {
        return [
            'visited_on' => 'date',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function relationships(): BelongsToMany
    {
        return $this->belongsToMany(Relationship::class, 'plan_visit_relationship');
    }
}
