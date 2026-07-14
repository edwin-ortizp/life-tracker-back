<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique();
            $table->string('category');
            $table->json('vehicle_types')->nullable();
            $table->json('power_sources')->nullable();
            $table->unsignedInteger('default_interval_days')->nullable();
            $table->decimal('default_interval_usage', 12, 2)->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_templates');
    }
};
