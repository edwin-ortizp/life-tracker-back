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
        Schema::create('tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('goal_id')->nullable();
            $table->integer('task_code')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->boolean('completed')->default(false);
            $table->string('category')->nullable();
            $table->string('priority')->nullable();
            $table->string('size')->nullable();
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->boolean('is_recurrent')->default(false);
            $table->boolean('is_private')->default(false);
            $table->json('recurrence')->nullable();
            $table->integer('progress')->default(0);
            $table->integer('elapsed_seconds')->default(0);
            $table->json('timer_start_time')->nullable();
            $table->boolean('timer_paused')->default(false);
            $table->integer('paused_duration')->default(0);
            $table->boolean('timer_active')->default(false);
            $table->integer('estimated_time')->nullable();
            $table->timestamps();

            $table->foreign('goal_id')->references('id')->on('goals')->nullOnDelete();
            $table->index(['user_id', 'completed']);
            $table->index(['user_id', 'task_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
