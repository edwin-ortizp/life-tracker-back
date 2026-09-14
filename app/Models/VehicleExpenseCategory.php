<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class VehicleExpenseCategory extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = ['name', 'icon', 'sort_order'];

    public function expenses() { return $this->hasMany(VehicleExpense::class); }
}
