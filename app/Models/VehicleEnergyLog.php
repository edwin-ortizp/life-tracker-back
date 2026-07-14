<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class VehicleEnergyLog extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = ['vehicle_id', 'recorded_on', 'energy_source', 'quantity', 'unit', 'is_full', 'cost', 'usage_reading', 'provider', 'notes'];

    protected function casts(): array
    {
        return ['recorded_on' => 'date', 'quantity' => 'decimal:2', 'is_full' => 'boolean', 'cost' => 'decimal:2', 'usage_reading' => 'decimal:2'];
    }

    public function vehicle() { return $this->belongsTo(Vehicle::class); }
}
