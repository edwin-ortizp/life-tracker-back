<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shopping_item_aliases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('shopping_item_id');
            $table->string('alias');
            $table->string('normalized_alias');
            $table->timestamps();

            $table->unique(['user_id', 'normalized_alias'], 'shopping_alias_user_term_unique');
            $table->index(['shopping_item_id', 'user_id'], 'shopping_alias_item_user_index');
            $table->foreign(
                ['shopping_item_id', 'user_id'],
                'shopping_alias_item_user_fk'
            )->references(['id', 'user_id'])->on('shopping_items')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shopping_item_aliases');
    }
};
