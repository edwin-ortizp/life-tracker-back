<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shopping_item_prices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('shopping_item_variant_id');
            $table->uuid('store_id');
            $table->decimal('amount', 12, 2);
            $table->date('observed_on');
            $table->string('source', 10); // manual, ticket, web
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('paid')->default(false);
            $table->timestamps();

            $table->index(['shopping_item_variant_id', 'store_id', 'observed_on'], 'item_prices_variant_store_date_index');
            $table->foreign(['shopping_item_variant_id', 'user_id'], 'item_prices_variant_user_fk')
                ->references(['id', 'user_id'])->on('shopping_item_variants')->cascadeOnDelete();
            $table->foreign(['store_id', 'user_id'], 'item_prices_store_user_fk')
                ->references(['id', 'user_id'])->on('stores')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shopping_item_prices');
    }
};
