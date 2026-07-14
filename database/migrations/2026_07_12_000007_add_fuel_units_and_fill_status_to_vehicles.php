<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->string('fuel_volume_unit', 3)->nullable()->after('power_source');
        });

        Schema::table('vehicle_energy_logs', function (Blueprint $table) {
            $table->boolean('is_full')->default(false)->after('unit');
        });
    }

    public function down(): void
    {
        Schema::table('vehicle_energy_logs', function (Blueprint $table) {
            $table->dropColumn('is_full');
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn('fuel_volume_unit');
        });
    }
};
