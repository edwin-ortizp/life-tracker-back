<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->decimal('manual_usage_reading', 12, 2)->nullable()->after('current_usage');
            $table->timestamp('manual_usage_recorded_at')->nullable()->after('manual_usage_reading');
        });

        DB::table('vehicles')->whereNotNull('current_usage')->orderBy('id')->each(function (object $vehicle): void {
            $hasEnergyReading = DB::table('vehicle_energy_logs')->where('vehicle_id', $vehicle->id)->whereNotNull('usage_reading')->exists();
            $hasMaintenanceReading = DB::table('vehicle_maintenance_logs')->where('vehicle_id', $vehicle->id)->whereNotNull('usage_reading')->exists();

            if (! $hasEnergyReading && ! $hasMaintenanceReading) {
                DB::table('vehicles')->where('id', $vehicle->id)->update([
                    'manual_usage_reading' => $vehicle->current_usage,
                    'manual_usage_recorded_at' => $vehicle->updated_at ?? $vehicle->created_at ?? now(),
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', fn (Blueprint $table) => $table->dropColumn(['manual_usage_reading', 'manual_usage_recorded_at']));
    }
};
