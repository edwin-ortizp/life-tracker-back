<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One emotional entry can involve several people, so the link lives in a pivot
     * rather than a column. Cascades only ever remove links: the entries and the
     * relationships themselves survive each other.
     */
    public function up(): void
    {
        Schema::create('mood_entry_relationship', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('mood_entry_id');
            $table->uuid('relationship_id');
            $table->timestamps();

            $table->foreign(['mood_entry_id', 'user_id'])
                ->references(['id', 'user_id'])
                ->on('mood_entries')
                ->cascadeOnDelete();
            $table->foreign(['relationship_id', 'user_id'])
                ->references(['id', 'user_id'])
                ->on('relationships')
                ->cascadeOnDelete();

            $table->unique(['user_id', 'mood_entry_id', 'relationship_id'], 'mood_entry_relationship_unique');
            $table->index(['user_id', 'relationship_id'], 'mood_entry_relationship_person_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mood_entry_relationship');
    }
};
