<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class PlanTag extends Model
{
    use BelongsToUser, HasFactory, HasUuids;

    protected $fillable = ['name', 'icon'];

    public function plans(): BelongsToMany
    {
        return $this->belongsToMany(Plan::class, 'plan_tag_assignments', 'plan_tag_id', 'plan_id')
            ->withTimestamps();
    }
}
