<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Circle extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = [
        'name',
        'sort_order',
        'description',
        'contact_frequency_days',
    ];

    public function relationships()
    {
        return $this->hasMany(Relationship::class);
    }
}
