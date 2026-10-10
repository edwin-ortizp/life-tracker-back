<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MealInventoryOperation extends Model
{
    use BelongsToUser, HasUuids;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['result' => 'array', 'reversed' => 'boolean'];
    }

    public function movements()
    {
        return $this->hasMany(MealInventoryMovement::class, 'operation_id');
    }
}
