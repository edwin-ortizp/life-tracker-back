<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/** A reference URL for a plan. Life Tracker only recognises the platform; it never fetches the link. */
class PlanLink extends Model
{
    use HasUuids;

    protected $fillable = [
        'url',
        'label',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /** @return array{label: string, icon: string} */
    public function platform(): array
    {
        $host = Str::lower((string) parse_url($this->url, PHP_URL_HOST));

        return match (true) {
            Str::contains($host, 'instagram') => ['label' => 'Instagram', 'icon' => 'bi-instagram'],
            Str::contains($host, 'tiktok') => ['label' => 'TikTok', 'icon' => 'bi-tiktok'],
            Str::contains($host, ['maps.google', 'maps.app.goo.gl', 'goo.gl']) || Str::contains($this->url, 'google.com/maps') => ['label' => 'Google Maps', 'icon' => 'bi-geo-alt-fill'],
            Str::contains($host, ['youtube', 'youtu.be']) => ['label' => 'YouTube', 'icon' => 'bi-youtube'],
            default => ['label' => Str::after($host, 'www.') ?: 'Enlace', 'icon' => 'bi-globe'],
        };
    }
}
