<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Images are referenced by URL and never downloaded; the lowest position is the main image.
        Schema::create('plan_images', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('plan_id')->constrained()->cascadeOnDelete();
            $table->string('url', 2048);
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();

            $table->index(['plan_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_images');
    }
};
