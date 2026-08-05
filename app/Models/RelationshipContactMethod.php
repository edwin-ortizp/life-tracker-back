<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class RelationshipContactMethod extends Model
{
    use BelongsToUser, HasFactory, HasUuids;

    public const TYPES = [
        'phone' => 'Teléfono',
        'email' => 'Correo',
        'social' => 'Perfil social',
        'other' => 'Otro',
    ];

    protected $fillable = [
        'relationship_id',
        'type',
        'label',
        'value',
        'is_primary',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (self $method): void {
            $method->value_normalized = static::normalize($method->value);
        });

        static::saved(function (self $method): void {
            if ($method->is_primary) {
                $method->demoteSiblings();
            }
        });
    }

    /** Search and uniqueness ignore the formatting a phone or handle was typed with. */
    public static function normalize(?string $value): string
    {
        return Str::of((string) $value)->lower()->replaceMatches('/[\s()\-\.]/', '')->value();
    }

    public function relationship(): BelongsTo
    {
        return $this->belongsTo(Relationship::class);
    }

    public function typeLabel(): string
    {
        return self::TYPES[$this->type] ?? self::TYPES['other'];
    }

    private function demoteSiblings(): void
    {
        static::query()
            ->where('relationship_id', $this->relationship_id)
            ->where('type', $this->type)
            ->whereKeyNot($this->getKey())
            ->update(['is_primary' => false]);
    }
}
