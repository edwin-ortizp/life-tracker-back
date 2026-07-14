<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('current_weight_kg', 5, 2)->nullable()->after('life_expectancy_years');
            $table->unsignedSmallInteger('height_cm')->nullable()->after('current_weight_kg');
            $table->date('birth_date')->nullable()->after('height_cm');
            $table->string('activity_level')->nullable()->after('birth_date');
            $table->unsignedSmallInteger('daily_water_goal')->nullable()->after('activity_level');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'current_weight_kg',
                'height_cm',
                'birth_date',
                'activity_level',
                'daily_water_goal',
            ]);
        });
    }
};
