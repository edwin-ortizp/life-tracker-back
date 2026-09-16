<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('habit_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('habit_id');
            // Resuelto contra App\Support\Habits\HabitActionRegistry.
            $table->string('action_key');
            // auto: se registra con los valores fijos. prompt: se pregunta al completar.
            $table->string('mode')->default('auto');
            $table->json('config')->nullable();
            $table->boolean('enabled')->default(true);
            $table->timestamps();

            $table->foreign(['habit_id', 'user_id'])
                ->references(['id', 'user_id'])
                ->on('habit_definitions')
                ->cascadeOnDelete();
            // Un hábito tiene como mucho una acción asociada.
            $table->unique(['user_id', 'habit_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('habit_actions');
    }
};
