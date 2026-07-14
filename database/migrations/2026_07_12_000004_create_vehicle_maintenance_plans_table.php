<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_maintenance_plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('vehicle_id');
            $table->uuid('maintenance_template_id');
            $table->unsignedInteger('interval_days')->nullable();
            $table->decimal('interval_usage', 12, 2)->nullable();
            $table->date('baseline_date')->nullable();
            $table->decimal('baseline_usage', 12, 2)->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->foreign(['vehicle_id', 'user_id'], 'vehicle_maint_plan_vehicle_user_fk')
                ->references(['id', 'user_id'])->on('vehicles')->cascadeOnDelete();
            $table->foreign('maintenance_template_id', 'vehicle_maint_plan_template_fk')
                ->references('id')->on('maintenance_templates')->restrictOnDelete();
            $table->unique(['vehicle_id', 'maintenance_template_id'], 'vehicle_maint_plan_template_unique');
            $table->unique(['id', 'user_id'], 'vehicle_maint_plan_id_user_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_maintenance_plans');
    }
};
