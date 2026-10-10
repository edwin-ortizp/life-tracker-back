<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ShoppingItemPrice extends Model
{
    use BelongsToUser, HasUuids;

    public const SOURCES = [
        'manual' => 'Manual',
        'ticket' => 'Ticket',
        'web' => 'Web',
    ];

    /** Días tras los cuales un precio se considera desactualizado. */
    public const STALE_AFTER_DAYS = 60;

    protected $fillable = [
        'purchase_line_id',
        'shopping_item_variant_id',
        'store_id',
        'amount',
        'observed_on',
        'source',
        'verified_at',
        'verified_by',
        'paid',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'observed_on' => 'date',
            'verified_at' => 'datetime',
            'paid' => 'boolean',
        ];
    }

    public function variant()
    {
        return $this->belongsTo(ShoppingItemVariant::class, 'shopping_item_variant_id');
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function isStale(): bool
    {
        return $this->observed_on->lt(now()->subDays(self::STALE_AFTER_DAYS)->startOfDay());
    }

    public function isVerified(): bool
    {
        return $this->verified_at !== null;
    }
}
