<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Context is always optional: existing and imported entries stay valid untouched,
     * so both columns are nullable and nothing is backfilled.
     */
    public function up(): void
    {
        Schema::table('mood_entries', function (Blueprint $table) {
            $table->unsignedTinyInteger('intensity')->nullable()->after('value');
            $table->string('situation', 500)->nullable()->after('intensity');

            // Child tables key on the owner as well, which SQLite and MySQL both
            // require to be backed by a unique index.
            $table->unique(['id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::table('mood_entries', function (Blueprint $table) {
            $table->dropUnique(['id', 'user_id']);
            $table->dropColumn(['intensity', 'situation']);
        });
    }
};
