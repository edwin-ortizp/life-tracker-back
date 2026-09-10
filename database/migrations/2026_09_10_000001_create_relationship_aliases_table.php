<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('relationship_aliases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('relationship_id');
            $table->string('alias');
            $table->timestamps();

            $table->foreign(['relationship_id', 'user_id'])
                ->references(['id', 'user_id'])
                ->on('relationships')
                ->cascadeOnDelete();
            $table->unique(['id', 'user_id']);
            $table->unique(['user_id', 'relationship_id', 'alias'], 'rel_alias_unique');
            $table->index(['user_id', 'alias'], 'rel_alias_search_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('relationship_aliases');
    }
};
