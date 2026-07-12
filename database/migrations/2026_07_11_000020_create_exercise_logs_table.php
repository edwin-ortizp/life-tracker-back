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
        Schema::create('exercise_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->integer('exercise_id')->nullable();
            $table->uuid('exercise_type_id')->nullable();
            $table->integer('sets')->nullable();
            $table->integer('reps')->nullable();
            $table->integer('duration')->nullable();
            $table->decimal('distance', 8, 2)->nullable();
            $table->decimal('weight', 8, 2)->nullable();
            $table->integer('calories')->nullable();
            $table->integer('steps')->nullable();
            $table->text('notes')->nullable();

            $table->foreign('exercise_type_id')->references('id')->on('exercise_types')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exercise_logs');
    }
};
