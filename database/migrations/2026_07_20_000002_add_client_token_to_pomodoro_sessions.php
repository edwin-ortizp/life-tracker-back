<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pomodoro_sessions', function (Blueprint $table): void {
            $table->uuid('client_token')->nullable()->unique()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('pomodoro_sessions', function (Blueprint $table): void {
            $table->dropUnique(['client_token']);
            $table->dropColumn('client_token');
        });
    }
};
