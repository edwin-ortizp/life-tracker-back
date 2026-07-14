<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = [
        'name', 'vehicle_type', 'power_source', 'transmission_type', 'fuel_volume_unit', 'usage_unit', 'current_usage', 'make', 'model',
        'year', 'registration_identifier', 'vin', 'engine_displacement', 'tank_capacity',
        'battery_capacity', 'photo_path',
    ];

    protected function casts(): array
    {
        return ['current_usage' => 'decimal:2', 'engine_displacement' => 'decimal:2', 'tank_capacity' => 'decimal:2', 'battery_capacity' => 'decimal:2'];
    }

    public function maintenancePlans() { return $this->hasMany(VehicleMaintenancePlan::class); }
    public function maintenanceLogs() { return $this->hasMany(VehicleMaintenanceLog::class); }
    public function energyLogs() { return $this->hasMany(VehicleEnergyLog::class); }
}
