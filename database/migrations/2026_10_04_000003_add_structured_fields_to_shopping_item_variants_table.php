<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shopping_item_variants', function (Blueprint $table) {
            $table->uuid('brand_id')->nullable()->after('shopping_item_id');
            $table->string('packaging', 20)->nullable()->after('brand_id');
            // Contenido en la unidad base del producto (g, ml o unidades).
            $table->decimal('content', 12, 3)->nullable()->after('packaging');
            $table->unsignedInteger('units_per_pack')->nullable()->after('content');
            $table->boolean('is_preferred')->default(false)->after('units_per_pack');
            $table->decimal('kcal', 8, 2)->nullable();
            $table->decimal('protein', 8, 2)->nullable();
            $table->decimal('carbs', 8, 2)->nullable();
            $table->decimal('fat', 8, 2)->nullable();

            $table->unique(['id', 'user_id']);
            $table->foreign('brand_id')->references('id')->on('brands')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('shopping_item_variants', function (Blueprint $table) {
            $table->dropForeign(['brand_id']);
            $table->dropUnique(['id', 'user_id']);
            $table->dropColumn(['brand_id', 'packaging', 'content', 'units_per_pack', 'is_preferred', 'kcal', 'protein', 'carbs', 'fat']);
        });
    }
};
