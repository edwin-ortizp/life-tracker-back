<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Identity and presentation state for the personal catalog. Defaults are chosen so
     * every existing row stays exactly as visible and usable as it is today.
     */
    public function up(): void
    {
        Schema::table('mood_states', function (Blueprint $table) {
            $table->string('default_key')->nullable()->after('category');
            $table->boolean('is_active')->default(true)->after('default_key');
            $table->boolean('is_pinned')->default(false)->after('is_active');
            $table->integer('sort_order')->default(0)->after('is_pinned');

            // Null for custom states, so several of them coexist per user.
            $table->unique(['user_id', 'default_key']);
            $table->index(['user_id', 'is_active', 'is_pinned', 'sort_order'], 'mood_states_picker_index');
        });
    }

    /**
     * Conservative on purpose: the emotions repaired on the way up may already back
     * historical entries, so only the columns go away.
     */
    public function down(): void
    {
        Schema::table('mood_states', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'default_key']);
            $table->dropIndex('mood_states_picker_index');
            $table->dropColumn(['default_key', 'is_active', 'is_pinned', 'sort_order']);
        });
    }
};
