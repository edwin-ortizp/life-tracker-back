<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Model;

class JournalWeeklySummary extends Model
{
    use BelongsToUser;

    public $timestamps = false;

    protected $fillable = [
        'year',
        'week',
        'entries_count',
    ];
}
