<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The generic `events` table only ever held relationship milestones, so it takes
     * the domain name the model already expected and gains an orderable date window.
     */
    public function up(): void
    {
        if (! Schema::hasTable('relationship_events')) {
            Schema::rename('events', 'relationship_events');
        }

        Schema::table('relationship_events', function (Blueprint $table) {
            $table->date('starts_on')->nullable()->after('event_date');
            $table->date('ends_on')->nullable()->after('starts_on');
        });

        foreach (DB::table('relationship_events')->cursor() as $event) {
            $start = $event->start_date ?? $event->event_date;
            $end = $event->end_date ?? $event->start_date ?? $event->event_date;

            DB::table('relationship_events')->where('id', $event->id)->update([
                'starts_on' => $start,
                'ends_on' => $end,
            ]);
        }

        Schema::table('relationship_events', function (Blueprint $table) {
            $table->index(['user_id', 'starts_on'], 'rel_event_window_index');
            $table->index(['user_id', 'relationship_id', 'starts_on'], 'rel_event_timeline_index');
        });
    }

    public function down(): void
    {
        Schema::table('relationship_events', function (Blueprint $table) {
            $table->dropIndex('rel_event_timeline_index');
            $table->dropIndex('rel_event_window_index');
            $table->dropColumn(['starts_on', 'ends_on']);
        });

        Schema::rename('relationship_events', 'events');
    }
};
