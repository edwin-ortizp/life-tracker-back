<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A plan exists once and is shared by the people and circles it is associated with.
        Schema::create('plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('type', 32);
            $table->string('category', 80)->nullable();
            $table->string('city', 120)->nullable();
            $table->string('address')->nullable();
            $table->string('status', 16)->default('pending');
            $table->date('scheduled_on')->nullable();
            $table->date('ends_on')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['id', 'user_id']);
            $table->index(['user_id', 'status']);
        });

        Schema::create('plan_relationship', function (Blueprint $table) {
            $table->foreignUuid('plan_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('relationship_id')->constrained()->cascadeOnDelete();
            $table->primary(['plan_id', 'relationship_id']);
        });

        Schema::create('circle_plan', function (Blueprint $table) {
            $table->foreignUuid('circle_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('plan_id')->constrained()->cascadeOnDelete();
            $table->primary(['circle_id', 'plan_id']);
        });

        Schema::create('plan_links', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('plan_id')->constrained()->cascadeOnDelete();
            $table->string('url', 2048);
            $table->string('label', 120)->nullable();
            $table->timestamps();
        });

        // Each time a plan is actually done, with whom and an optional comment.
        Schema::create('plan_visits', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('plan_id')->constrained()->cascadeOnDelete();
            $table->date('visited_on');
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->index(['plan_id', 'visited_on']);
        });

        Schema::create('plan_visit_relationship', function (Blueprint $table) {
            $table->foreignUuid('plan_visit_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('relationship_id')->constrained()->cascadeOnDelete();
            $table->primary(['plan_visit_id', 'relationship_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_visit_relationship');
        Schema::dropIfExists('plan_visits');
        Schema::dropIfExists('plan_links');
        Schema::dropIfExists('circle_plan');
        Schema::dropIfExists('plan_relationship');
        Schema::dropIfExists('plans');
    }
};
