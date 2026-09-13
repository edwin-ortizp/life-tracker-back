<?php

use App\Actions\SeedDefaultCircles;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        DB::table('users')->orderBy('id')->pluck('id')->each(function (int $userId) use ($now): void {
            $existing = DB::table('circles')->where('user_id', $userId)->pluck('name')->map(fn (string $name) => Str::lower($name))->all();

            $rows = collect(SeedDefaultCircles::NAMES)
                ->reject(fn (string $name) => in_array(Str::lower($name), $existing, true))
                ->map(fn (string $name) => [
                    'id' => (string) Str::uuid(),
                    'user_id' => $userId,
                    'name' => $name,
                    'sort_order' => array_search($name, SeedDefaultCircles::NAMES, true) + 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])
                ->values()
                ->all();

            if ($rows !== []) {
                DB::table('circles')->insert($rows);
            }
        });
    }

    public function down(): void
    {
        // Circles are user data once created; they are not removed on rollback.
    }
};
