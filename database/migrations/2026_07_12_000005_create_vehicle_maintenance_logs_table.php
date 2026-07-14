<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_maintenance_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('vehicle_id');
            $table->uuid('vehicle_maintenance_plan_id');
            $table->date('performed_on');
            $table->decimal('usage_reading', 12, 2)->nullable();
            $table->decimal('cost', 12, 2)->nullable();
            $table->string('provider')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign(['vehicle_id', 'user_id'], 'vehicle_maint_log_vehicle_user_fk')
                ->references(['id', 'user_id'])->on('vehicles')->cascadeOnDelete();
            $table->foreign(['vehicle_maintenance_plan_id', 'user_id'], 'vehicle_maint_log_plan_user_fk')
                ->references(['id', 'user_id'])->on('vehicle_maintenance_plans')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_maintenance_logs');
    }
};
