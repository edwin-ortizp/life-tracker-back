<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('health_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('health_event_id');
            $table->date('date');
            $table->unsignedTinyInteger('intensity');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign(['health_event_id', 'user_id'])
                ->references(['id', 'user_id'])
                ->on('health_events')
                ->cascadeOnDelete();
            $table->unique(['health_event_id', 'date']);
            $table->index(['user_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('health_logs');
    }
};
