<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HealthLog extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = ['health_event_id', 'date', 'intensity', 'notes'];

    protected function casts(): array
    {
        return ['date' => 'date', 'intensity' => 'integer'];
    }

    public function healthEvent(): BelongsTo
    {
        return $this->belongsTo(HealthEvent::class);
    }
}
