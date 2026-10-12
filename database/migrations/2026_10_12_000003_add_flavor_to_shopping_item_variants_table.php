<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shopping_item_variants', function (Blueprint $table) {
            // Sabor de la variante: distingue palomitas de mantequilla y de queso de la misma marca.
            $table->string('flavor', 60)->nullable()->after('packaging');
        });
    }

    public function down(): void
    {
        Schema::table('shopping_item_variants', function (Blueprint $table) {
            $table->dropColumn('flavor');
        });
    }
};
