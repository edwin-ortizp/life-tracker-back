<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class VehicleMaintenanceLog extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = ['vehicle_id', 'vehicle_maintenance_plan_id', 'performed_on', 'usage_reading', 'cost', 'provider', 'notes'];

    protected function casts(): array
    {
        return ['performed_on' => 'date', 'usage_reading' => 'decimal:2', 'cost' => 'decimal:2'];
    }

    public function vehicle() { return $this->belongsTo(Vehicle::class); }
    public function plan() { return $this->belongsTo(VehicleMaintenancePlan::class, 'vehicle_maintenance_plan_id'); }
}
