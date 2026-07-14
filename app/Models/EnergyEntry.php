<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EnergyEntry extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = [
        'date',
        'level',
        'time',
        'timestamp',
        'comment',
        'source',
        'source_key',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }
}
