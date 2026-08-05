<?php

use App\Models\User;
use App\Support\MoodCatalogRestorer;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * The earlier backfill only added the nuanced words, so accounts created before it —
     * or with an empty catalog — never got the base vocabulary. This one completes both,
     * through the same idempotent service registration and Restaurar use.
     */
    public function up(): void
    {
        $restorer = new MoodCatalogRestorer();

        User::withoutGlobalScopes()->cursor()->each(
            fn (User $user) => $restorer->syncDefaults($user)
        );
    }

    /**
     * Nothing is removed: an emotion created here may already back a historical entry.
     * The previous migration takes the new columns away; the vocabulary stays.
     */
    public function down(): void
    {
        //
    }
};
