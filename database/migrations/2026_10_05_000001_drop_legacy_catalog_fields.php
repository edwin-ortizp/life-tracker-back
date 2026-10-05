<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tras migrar el catálogo a productos, variantes y precios, se eliminan los campos de texto libre.
 */
return new class extends Migration
{
    public function up(): void
    {
        // En MySQL la llave foránea de shopping_item_id se apoya en el índice compuesto con place:
        // primero se le da su propio índice y luego se puede quitar el compuesto.
        Schema::table('shopping_item_variants', function (Blueprint $table) {
            $table->index('shopping_item_id');
        });

        Schema::table('shopping_item_variants', function (Blueprint $table) {
            $table->dropIndex(['shopping_item_id', 'place']);
        });

        Schema::table('shopping_item_variants', function (Blueprint $table) {
            $table->dropColumn(['place', 'price', 'presentation', 'notes']);
        });

        Schema::table('shopping_items', function (Blueprint $table) {
            $table->dropColumn('unit');
        });
    }

    public function down(): void
    {
        Schema::table('shopping_items', function (Blueprint $table) {
            $table->string('unit')->nullable();
        });

        Schema::table('shopping_item_variants', function (Blueprint $table) {
            $table->string('place')->nullable();
            $table->decimal('price', 10, 2)->nullable();
            $table->string('presentation')->nullable();
            $table->text('notes')->nullable();
            $table->index(['shopping_item_id', 'place']);
        });

        Schema::table('shopping_item_variants', function (Blueprint $table) {
            $table->dropIndex(['shopping_item_id']);
        });
    }
};
