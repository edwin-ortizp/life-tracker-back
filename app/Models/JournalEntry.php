<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Model;

class JournalEntry extends Model
{
    use BelongsToUser;

    public $timestamps = false;

    protected $fillable = [
        'date',
        'text',
        'display_time',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }
}
