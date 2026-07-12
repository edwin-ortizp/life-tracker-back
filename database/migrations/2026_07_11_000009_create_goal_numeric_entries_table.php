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
        Schema::create('goal_numeric_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('goal_id');
            $table->decimal('value', 10, 2);
            $table->date('date');
            $table->text('note')->nullable();

            $table->foreign('goal_id')->references('id')->on('goals')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('goal_numeric_entries');
    }
};
