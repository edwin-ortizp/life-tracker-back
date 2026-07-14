<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MaintenanceTemplate extends Model
{
    use HasUuids;

    protected $fillable = ['user_id', 'name', 'category', 'vehicle_types', 'power_sources', 'transmission_types', 'default_interval_days', 'default_interval_usage', 'description'];

    protected function casts(): array
    {
        return ['vehicle_types' => 'array', 'power_sources' => 'array', 'transmission_types' => 'array', 'default_interval_usage' => 'decimal:2'];
    }

    public function scopeAvailableTo(Builder $query, int $userId): Builder
    {
        return $query->where(fn (Builder $templates) => $templates->whereNull('user_id')->orWhere('user_id', $userId));
    }

    public function owner() { return $this->belongsTo(User::class, 'user_id'); }
}
