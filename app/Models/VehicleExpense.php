<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class VehicleExpense extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = ['vehicle_id', 'vehicle_expense_category_id', 'spent_on', 'amount', 'description', 'usage_reading', 'provider'];

    protected function casts(): array
    {
        return ['spent_on' => 'date', 'amount' => 'decimal:2', 'usage_reading' => 'decimal:2'];
    }

    public function vehicle() { return $this->belongsTo(Vehicle::class); }
    public function category() { return $this->belongsTo(VehicleExpenseCategory::class, 'vehicle_expense_category_id'); }
}
