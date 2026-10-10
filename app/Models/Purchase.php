<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    use BelongsToUser, HasUuids;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['purchased_at' => 'datetime', 'total_paid' => 'decimal:2'];
    }

    public function lines()
    {
        return $this->hasMany(PurchaseLine::class);
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function summary(): array
    {
        return [
            'lines_total' => round($this->lines->sum(fn ($line) => $line->unit_price === null ? 0 : (float) $line->unit_price * (float) $line->packages), 2),
            'lines_total_complete' => $this->lines->every(fn ($line) => $line->unit_price !== null),
        ];
    }
}
