<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('meal_plan_entries', function (Blueprint $table) {
            $table->unique(['id', 'user_id'], 'meal_plan_entries_id_user_unique');
        });

        Schema::table('meal_plan_entry_items', function (Blueprint $table) {
            $table->dropForeign(['meal_plan_entry_id']);
            $table->foreign(['meal_plan_entry_id', 'user_id'], 'meal_plan_items_entry_user_foreign')
                ->references(['id', 'user_id'])
                ->on('meal_plan_entries')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('meal_plan_entry_items', function (Blueprint $table) {
            $table->dropForeign('meal_plan_items_entry_user_foreign');
            $table->foreign('meal_plan_entry_id')->references('id')->on('meal_plan_entries')->cascadeOnDelete();
        });

        Schema::table('meal_plan_entries', function (Blueprint $table) {
            $table->dropUnique('meal_plan_entries_id_user_unique');
        });
    }
};
