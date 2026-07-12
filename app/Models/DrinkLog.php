<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class DrinkLog extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = [
        'date',
        'drink_type',
        'amount',
        'hydration_value',
        'time',
        'timestamp',
        'drink_type_id',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    public function drinkType()
    {
        return $this->belongsTo(DrinkType::class);
    }
}
