<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('health_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('title');
            $table->date('event_date');
            $table->date('end_date')->nullable();
            $table->text('notes')->nullable();
            $table->json('details')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'event_date']);
            $table->index(['user_id', 'type', 'event_date']);
            $table->unique(['id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('health_events');
    }
};
