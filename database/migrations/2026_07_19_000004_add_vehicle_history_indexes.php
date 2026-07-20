<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicle_energy_logs', function (Blueprint $table) {
            $table->index(['vehicle_id', 'recorded_on', 'created_at'], 'vehicle_energy_history_idx');
            $table->index(['vehicle_id', 'energy_source', 'is_full', 'recorded_on', 'created_at'], 'vehicle_energy_efficiency_idx');
        });
        Schema::table('vehicle_maintenance_logs', fn (Blueprint $table) => $table->index(['vehicle_id', 'performed_on', 'created_at'], 'vehicle_maintenance_history_idx'));
        Schema::table('vehicle_maintenance_plans', fn (Blueprint $table) => $table->index(['vehicle_id', 'active'], 'vehicle_maintenance_active_idx'));
    }

    public function down(): void
    {
        Schema::table('vehicle_energy_logs', function (Blueprint $table) {
            $table->dropIndex('vehicle_energy_history_idx');
            $table->dropIndex('vehicle_energy_efficiency_idx');
        });
        Schema::table('vehicle_maintenance_logs', fn (Blueprint $table) => $table->dropIndex('vehicle_maintenance_history_idx'));
        Schema::table('vehicle_maintenance_plans', fn (Blueprint $table) => $table->dropIndex('vehicle_maintenance_active_idx'));
    }
};
