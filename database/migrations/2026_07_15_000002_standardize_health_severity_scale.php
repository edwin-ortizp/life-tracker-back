<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('health_events')
            ->where('type', 'symptom')
            ->whereNotNull('details')
            ->orderBy('id')
            ->each(function (object $event): void {
                $details = json_decode($event->details, true);
                $severity = $details['severity'] ?? null;

                if (! is_int($severity) || $severity < 1 || $severity > 5) {
                    return;
                }

                $details['severity'] = $severity * 2;

                DB::table('health_events')
                    ->where('id', $event->id)
                    ->update(['details' => json_encode($details)]);
            });
    }

    public function down(): void
    {
        // La conversión conserva la escala 1–10 elegida como estándar.
    }
};
