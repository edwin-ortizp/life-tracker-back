<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shopping_item_variants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shopping_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('place')->nullable();
            $table->decimal('price', 10, 2)->nullable();
            $table->string('barcode')->nullable();
            $table->string('presentation')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['shopping_item_id', 'place']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shopping_item_variants');
    }
};
