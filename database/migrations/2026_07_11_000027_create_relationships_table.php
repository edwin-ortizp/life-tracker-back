<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('relationships', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('circle_id')->nullable();
            $table->string('full_name');
            $table->string('nickname')->nullable();
            $table->string('category');
            $table->date('birthday_date')->nullable();
            $table->smallInteger('birthday_month')->nullable();
            $table->smallInteger('birthday_day')->nullable();
            $table->timestamp('last_contact_at')->nullable();
            $table->timestamp('next_contact_suggested_at')->nullable();
            $table->json('notes')->nullable();
            $table->boolean('is_archived')->default(false);
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->foreign(['circle_id', 'user_id'])
                ->references(['id', 'user_id'])
                ->on('circles')
                ->restrictOnDelete();
            $table->unique(['id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('relationships');
    }
};
