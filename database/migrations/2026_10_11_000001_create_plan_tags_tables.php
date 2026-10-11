<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_tags', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 60);
            $table->string('icon', 40)->default('bi-tag');
            $table->timestamps();

            $table->unique(['id', 'user_id']);
            $table->unique(['user_id', 'name'], 'plan_tag_name_unique');
        });

        Schema::create('plan_tag_assignments', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('plan_id');
            $table->uuid('plan_tag_id');
            $table->timestamps();

            $table->foreign(['plan_id', 'user_id'])
                ->references(['id', 'user_id'])->on('plans')->cascadeOnDelete();
            $table->foreign(['plan_tag_id', 'user_id'])
                ->references(['id', 'user_id'])->on('plan_tags')->cascadeOnDelete();
            $table->unique(['user_id', 'plan_id', 'plan_tag_id'], 'plan_tag_assignment_unique');
            $table->index(['user_id', 'plan_tag_id'], 'plan_tag_assignment_tag_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_tag_assignments');
        Schema::dropIfExists('plan_tags');
    }
};
