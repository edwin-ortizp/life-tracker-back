<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('maintenance_templates', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->json('transmission_types')->nullable()->after('power_sources');
            $table->dropUnique('maintenance_templates_name_unique');
            $table->unique(['user_id', 'name'], 'maintenance_templates_user_name_unique');
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->string('transmission_type')->nullable()->after('power_source');
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn('transmission_type');
        });

        Schema::table('maintenance_templates', function (Blueprint $table) {
            $table->dropUnique('maintenance_templates_user_name_unique');
            $table->dropConstrainedForeignId('user_id');
            $table->dropColumn('transmission_types');
            $table->unique('name');
        });
    }
};
