<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recipes', function (Blueprint $table) {
            $table->decimal('servings', 6, 2)->default(1)->after('prep_time');
            $table->string('nutrition_source', 12)->default('manual')->after('nutrition'); // manual, calculated
        });

        Schema::table('recipe_ingredients', function (Blueprint $table) {
            $table->decimal('quantity', 12, 3)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('recipes', function (Blueprint $table) {
            $table->dropColumn(['servings', 'nutrition_source']);
        });
    }
};
