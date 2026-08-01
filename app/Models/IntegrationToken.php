<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class IntegrationToken extends Model
{
    public const PREFIX = 'lt_ob_';

    public const CALDAV_PREFIX = 'lt_cd_';

    protected $fillable = [
        'user_id',
        'purpose',
        'name',
        'token_hash',
        'last_used_at',
        'revoked_at',
    ];

    protected $hidden = [
        'token_hash',
    ];

    protected function casts(): array
    {
        return [
            'last_used_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return array{0: self, 1: string}
     */
    public static function issueFor(User $user, string $name, string $purpose = 'obsidian', string $prefix = self::PREFIX): array
    {
        return DB::transaction(function () use ($user, $name, $purpose, $prefix): array {
            static::query()
                ->where('user_id', $user->id)
                ->where('purpose', $purpose)
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);

            $plainTextToken = $prefix.bin2hex(random_bytes(32));
            $token = static::create([
                'user_id' => $user->id,
                'purpose' => $purpose,
                'name' => $name,
                'token_hash' => hash('sha256', $plainTextToken),
            ]);

            return [$token, $plainTextToken];
        });
    }
}
