<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Categories, notes, declared date precision and sensitivity turn a bare date row
     * into a timeline entry that can be filtered without leaking private context.
     */
    public function up(): void
    {
        Schema::table('relationship_events', function (Blueprint $table) {
            $table->string('category')->default('other')->after('title');
            $table->text('notes')->nullable()->after('category');
            $table->string('date_precision')->default('day')->after('ends_on');
            $table->boolean('is_sensitive')->default(false)->after('date_precision');
        });

        foreach (DB::table('relationship_events')->cursor() as $event) {
            DB::table('relationship_events')->where('id', $event->id)->update([
                'category' => $event->event_type ?: 'other',
                'date_precision' => $event->starts_on !== $event->ends_on ? 'range' : 'day',
            ]);
        }

        Schema::table('relationship_events', function (Blueprint $table) {
            $table->index(['user_id', 'is_sensitive', 'is_archived'], 'rel_event_visibility_index');
            $table->index(['user_id', 'category'], 'rel_event_category_index');
        });
    }

    public function down(): void
    {
        Schema::table('relationship_events', function (Blueprint $table) {
            $table->dropIndex('rel_event_category_index');
            $table->dropIndex('rel_event_visibility_index');
            $table->dropColumn(['category', 'notes', 'date_precision', 'is_sensitive']);
        });
    }
};
