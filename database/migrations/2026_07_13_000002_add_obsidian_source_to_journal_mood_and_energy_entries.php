<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['journal_entries', 'mood_entries', 'energy_entries'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->string('source')->default('manual');
                $table->string('source_key')->nullable();
                $table->unique(['user_id', 'source_key']);
            });
        }
    }

    public function down(): void
    {
        foreach (['journal_entries', 'mood_entries', 'energy_entries'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->dropUnique(['user_id', 'source_key']);
                $table->dropColumn(['source', 'source_key']);
            });
        }
    }
};
