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
        Schema::create('goal_tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('goal_id');
            $table->string('title');
            $table->boolean('done')->default(false);
            $table->timestamps();
            $table->timestamp('completed_at')->nullable();

            $table->foreign('goal_id')->references('id')->on('goals')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('goal_tasks');
    }
};
