<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Repeatable relationship data lives in child tables so it can be validated,
     * searched and owned per user instead of hiding inside the notes payload.
     */
    public function up(): void
    {
        Schema::create('relationship_contact_methods', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('relationship_id');
            $table->string('type');
            $table->string('label')->nullable();
            $table->string('value');
            $table->string('value_normalized');
            $table->boolean('is_primary')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign(['relationship_id', 'user_id'])
                ->references(['id', 'user_id'])
                ->on('relationships')
                ->cascadeOnDelete();
            $table->unique(['id', 'user_id']);
            $table->index(['user_id', 'value_normalized'], 'rel_contact_search_index');
            $table->index(['user_id', 'relationship_id', 'type'], 'rel_contact_owner_index');
        });

        Schema::create('relationship_tags', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('color')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['id', 'user_id']);
            $table->unique(['user_id', 'name'], 'rel_tag_name_unique');
        });

        Schema::create('relationship_tag_assignments', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('relationship_id');
            $table->uuid('relationship_tag_id');
            $table->timestamps();

            $table->foreign(['relationship_id', 'user_id'])
                ->references(['id', 'user_id'])
                ->on('relationships')
                ->cascadeOnDelete();
            $table->foreign(['relationship_tag_id', 'user_id'])
                ->references(['id', 'user_id'])
                ->on('relationship_tags')
                ->cascadeOnDelete();
            $table->unique(['user_id', 'relationship_id', 'relationship_tag_id'], 'rel_tag_assignment_unique');
            $table->index(['user_id', 'relationship_tag_id'], 'rel_tag_assignment_tag_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('relationship_tag_assignments');
        Schema::dropIfExists('relationship_tags');
        Schema::dropIfExists('relationship_contact_methods');
    }
};
