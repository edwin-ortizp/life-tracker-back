<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Guarda qué registro creó el hábito al completarse, para poder deshacerlo
     * cuando el usuario lo desmarca. El tipo usa el morph map de AppServiceProvider.
     */
    public function up(): void
    {
        Schema::table('habit_completions', function (Blueprint $table) {
            $table->string('actionable_type')->nullable()->after('completed');
            $table->string('actionable_id')->nullable()->after('actionable_type');

            $table->index(['actionable_type', 'actionable_id']);
        });
    }

    public function down(): void
    {
        Schema::table('habit_completions', function (Blueprint $table) {
            $table->dropIndex(['actionable_type', 'actionable_id']);
            $table->dropColumn(['actionable_type', 'actionable_id']);
        });
    }
};
