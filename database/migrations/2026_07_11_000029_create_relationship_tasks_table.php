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
        Schema::create('relationship_tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('relationship_id');
            $table->uuid('task_id');
            $table->timestamps();

            $table->foreign(['relationship_id', 'user_id'])
                ->references(['id', 'user_id'])
                ->on('relationships')
                ->cascadeOnDelete();
            $table->foreign(['task_id', 'user_id'])
                ->references(['id', 'user_id'])
                ->on('tasks')
                ->cascadeOnDelete();
            $table->unique(['user_id', 'relationship_id', 'task_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('relationship_tasks');
    }
};
