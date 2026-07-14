<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_energy_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('vehicle_id');
            $table->date('recorded_on');
            $table->string('energy_source');
            $table->decimal('quantity', 10, 2);
            $table->string('unit', 8);
            $table->decimal('cost', 12, 2)->nullable();
            $table->decimal('usage_reading', 12, 2)->nullable();
            $table->string('provider')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign(['vehicle_id', 'user_id'], 'vehicle_energy_log_vehicle_user_fk')
                ->references(['id', 'user_id'])->on('vehicles')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_energy_logs');
    }
};
