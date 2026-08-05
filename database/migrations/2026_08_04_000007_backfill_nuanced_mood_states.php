<?php

use App\Models\User;
use App\Support\DefaultMoodStates;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Give existing accounts the finer-grained vocabulary. Keyed on the state text,
     * so custom states and already present words are left exactly as they are.
     */
    public function up(): void
    {
        User::withoutGlobalScopes()->cursor()->each(function (User $user): void {
            foreach (DefaultMoodStates::nuanced() as $state) {
                $user->moodStates()->withoutGlobalScopes()->firstOrCreate(['text' => $state['text']], $state);
            }
        });
    }

    /**
     * Only remove words that were never used, so no entry is ever orphaned.
     */
    public function down(): void
    {
        $texts = array_column(DefaultMoodStates::nuanced(), 'text');

        DB::table('mood_states')
            ->whereIn('text', $texts)
            ->whereNotExists(function ($query): void {
                $query->select(DB::raw(1))
                    ->from('mood_entries')
                    ->whereColumn('mood_entries.mood_state_id', 'mood_states.id');
            })
            ->delete();
    }
};
