<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class VehicleMaintenancePlan extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = ['vehicle_id', 'maintenance_template_id', 'interval_days', 'interval_usage', 'baseline_date', 'baseline_usage', 'active'];

    protected function casts(): array
    {
        return ['baseline_date' => 'date', 'baseline_usage' => 'decimal:2', 'interval_usage' => 'decimal:2', 'active' => 'boolean'];
    }

    public function vehicle() { return $this->belongsTo(Vehicle::class); }
    public function template() { return $this->belongsTo(MaintenanceTemplate::class, 'maintenance_template_id'); }
    public function maintenanceLogs() { return $this->hasMany(VehicleMaintenanceLog::class); }
}
