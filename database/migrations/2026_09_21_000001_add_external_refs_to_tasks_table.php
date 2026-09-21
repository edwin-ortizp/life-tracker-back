<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Referencias a elementos equivalentes en sistemas externos (Jira, Google Calendar, Gesthor...).
     * Lista JSON de {provider, type, id, url?, label?}; un proveedor nuevo no requiere columnas nuevas.
     */
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->json('external_refs')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('external_refs');
        });
    }
};
