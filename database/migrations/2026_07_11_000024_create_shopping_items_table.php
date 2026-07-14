<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('shopping_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->integer('stock')->default(0);
            $table->integer('to_buy')->default(0);
            $table->decimal('price', 10, 2)->nullable();
            $table->string('category')->nullable();
            $table->string('place')->nullable();
            $table->date('consume_by')->nullable();
            $table->string('status');
            $table->boolean('next_purchase')->default(false);
            $table->string('unit')->nullable();
            $table->string('barcode')->nullable();
            $table->timestamps();

            $table->unique(['id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shopping_items');
    }
};
