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
        Schema::create('recipe_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('recipe_id');
            $table->uuid('shopping_item_id');
            $table->decimal('quantity', 8, 2);
            $table->string('unit')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign(['recipe_id', 'user_id'])
                ->references(['id', 'user_id'])
                ->on('recipes')
                ->cascadeOnDelete();
            $table->foreign(['shopping_item_id', 'user_id'])
                ->references(['id', 'user_id'])
                ->on('shopping_items')
                ->cascadeOnDelete();
            $table->unique(['user_id', 'recipe_id', 'shopping_item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recipe_ingredients');
    }
};
