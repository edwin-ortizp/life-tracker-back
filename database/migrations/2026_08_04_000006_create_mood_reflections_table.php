<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A reflection is a separate, optional child of one entry, so the frequently read
     * `mood_entries` row stays light and reflection text can be loaded on demand.
     */
    public function up(): void
    {
        Schema::create('mood_reflections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('mood_entry_id');
            $table->string('status')->default('draft');
            $table->string('current_step')->nullable();
            $table->text('automatic_thought')->nullable();
            $table->text('evidence_for')->nullable();
            $table->text('evidence_against')->nullable();
            $table->text('balanced_perspective')->nullable();
            $table->unsignedTinyInteger('intensity_after')->nullable();
            $table->text('next_step')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->foreign(['mood_entry_id', 'user_id'])
                ->references(['id', 'user_id'])
                ->on('mood_entries')
                ->cascadeOnDelete();
            $table->unique('mood_entry_id');
            $table->unique(['id', 'user_id']);
            $table->index(['user_id', 'status'], 'mood_reflection_status_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mood_reflections');
    }
};
