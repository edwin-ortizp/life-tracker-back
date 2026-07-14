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
        Schema::create('meal_plan_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->string('meal_type');
            $table->uuid('recipe_id')->nullable();
            $table->string('name')->nullable();
            $table->text('notes')->nullable();
            $table->integer('calories')->nullable();

            $table->foreign(['recipe_id', 'user_id'])
                ->references(['id', 'user_id'])
                ->on('recipes')
                ->restrictOnDelete();
            $table->unique(['user_id', 'date', 'meal_type']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meal_plan_entries');
    }
};
