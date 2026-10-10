<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('store_id')->nullable();
            $table->dateTime('purchased_at');
            $table->decimal('total_paid', 14, 2)->nullable();
            $table->string('payment_method')->nullable();
            $table->string('ticket_reference')->nullable();
            $table->text('notes')->nullable();
            $table->uuid('operation_key');
            $table->timestamps();
            $table->unique(['id', 'user_id']);
            $table->unique(['user_id', 'operation_key']);
            $table->unique(['user_id', 'store_id', 'ticket_reference'], 'purchase_ticket_unique');
            $table->index(['user_id', 'purchased_at']);
            $table->foreign(['store_id', 'user_id'])->references(['id', 'user_id'])->on('stores')->restrictOnDelete();
        });
        Schema::create('purchase_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('purchase_id');
            $table->uuid('shopping_item_id');
            $table->uuid('shopping_item_variant_id')->nullable();
            $table->string('product_name');
            $table->string('variant_label')->nullable();
            $table->string('base_unit')->nullable();
            $table->decimal('content', 16, 6)->nullable();
            $table->decimal('packages', 16, 6);
            $table->decimal('unit_price', 14, 2)->nullable();
            $table->decimal('stock_added', 16, 6);
            $table->string('ticket_text')->nullable();
            $table->timestamps();
            $table->foreign(['purchase_id', 'user_id'])->references(['id', 'user_id'])->on('purchases')->cascadeOnDelete();
            $table->foreign(['shopping_item_id', 'user_id'])->references(['id', 'user_id'])->on('shopping_items')->restrictOnDelete();
            $table->foreign(['shopping_item_variant_id', 'user_id'], 'purchase_line_variant_fk')->references(['id', 'user_id'])->on('shopping_item_variants')->restrictOnDelete();
        });
        Schema::table('shopping_item_prices', function (Blueprint $table) {
            $table->foreignUuid('purchase_line_id')->nullable()->unique()->constrained('purchase_lines')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('shopping_item_prices', function (Blueprint $table) {
            $table->dropConstrainedForeignId('purchase_line_id');
        });
        Schema::dropIfExists('purchase_lines');
        Schema::dropIfExists('purchases');
    }
};
