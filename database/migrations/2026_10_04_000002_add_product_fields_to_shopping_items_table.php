<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shopping_items', function (Blueprint $table) {
            $table->decimal('stock', 12, 3)->default(0)->change();
            $table->decimal('to_buy', 12, 3)->default(0)->change();
        });

        Schema::table('shopping_items', function (Blueprint $table) {
            $table->string('base_unit', 10)->nullable()->after('name'); // g, ml, unit
            $table->decimal('grams_per_piece', 10, 3)->nullable()->after('base_unit');
            $table->decimal('min_stock', 12, 3)->nullable()->after('stock');
            // Nutrición por 100 g, por 100 ml o por unidad, según la unidad base.
            $table->decimal('kcal', 8, 2)->nullable();
            $table->decimal('protein', 8, 2)->nullable();
            $table->decimal('carbs', 8, 2)->nullable();
            $table->decimal('fat', 8, 2)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('shopping_items', function (Blueprint $table) {
            $table->dropColumn(['base_unit', 'grams_per_piece', 'min_stock', 'kcal', 'protein', 'carbs', 'fat']);
        });
    }
};
