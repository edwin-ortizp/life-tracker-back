<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('vehicle_type');
            $table->string('power_source');
            $table->string('usage_unit')->nullable();
            $table->decimal('current_usage', 12, 2)->nullable();
            $table->string('make')->nullable();
            $table->string('model')->nullable();
            $table->unsignedSmallInteger('year')->nullable();
            $table->string('registration_identifier')->nullable();
            $table->string('vin')->nullable();
            $table->decimal('engine_displacement', 8, 2)->nullable();
            $table->decimal('tank_capacity', 8, 2)->nullable();
            $table->decimal('battery_capacity', 8, 2)->nullable();
            $table->string('photo_path')->nullable();
            $table->timestamps();

            $table->unique(['id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
