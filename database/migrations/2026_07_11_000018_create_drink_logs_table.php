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
        Schema::create('drink_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->string('drink_type');
            $table->integer('amount');
            $table->integer('hydration_value');
            $table->string('time');
            $table->bigInteger('timestamp');
            $table->uuid('drink_type_id')->nullable();

            $table->foreign('drink_type_id')->references('id')->on('drink_types')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('drink_logs');
    }
};
