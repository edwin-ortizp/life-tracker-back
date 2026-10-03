<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Eventos de salud íntimos que no deben salir en consultas amplias (p. ej. las
     * herramientas MCP) salvo que se pidan; mismo criterio que relationship_events.
     */
    public function up(): void
    {
        Schema::table('health_events', function (Blueprint $table) {
            $table->boolean('is_sensitive')->default(false)->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('health_events', function (Blueprint $table) {
            $table->dropColumn('is_sensitive');
        });
    }
};
