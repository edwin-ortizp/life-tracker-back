<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meal_inventory_operations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('operation_key', 100);
            $table->string('action');
            $table->string('fingerprint', 64);
            $table->json('result')->nullable();
            $table->boolean('reversed')->default(false);
            $table->timestamps();
            $table->unique(['user_id', 'operation_key'], 'meal_operation_user_key');
        });
        Schema::create('meal_preparations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('recipe_id')->constrained('recipes')->restrictOnDelete();
            $table->foreignUuid('operation_id')->constrained('meal_inventory_operations')->restrictOnDelete();
            $table->string('name');
            $table->dateTime('cooked_at');
            $table->date('consume_by')->nullable();
            $table->decimal('portions', 12, 2);
            $table->json('ingredients');
            $table->json('nutrition')->nullable();
            $table->boolean('cancelled')->default(false);
            $table->timestamps();
        });
        Schema::create('meal_inventory_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('operation_id')->constrained('meal_inventory_operations')->restrictOnDelete();
            $table->foreignUuid('shopping_item_id')->nullable()->constrained('shopping_items')->restrictOnDelete();
            $table->foreignUuid('preparation_id')->nullable()->constrained('meal_preparations')->restrictOnDelete();
            $table->string('name');
            $table->string('unit');
            $table->decimal('delta', 14, 3);
            $table->timestamps();
        });
        Schema::table('meal_plan_entries', function (Blueprint $table) {
            $table->string('status')->default('planned');
            $table->string('consumption_mode')->nullable();
            $table->dateTime('consumed_at')->nullable();
            $table->json('consumption')->nullable();
            $table->foreignUuid('consumption_operation_id')->nullable()->constrained('meal_inventory_operations')->restrictOnDelete();
        });
        Schema::table('meal_plan_entry_items', function (Blueprint $table) {
            $table->foreignUuid('preparation_id')->nullable()->constrained('meal_preparations')->restrictOnDelete();
            $table->json('ingredients')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('meal_plan_entry_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('preparation_id');
            $table->dropColumn('ingredients');
        });
        Schema::table('meal_plan_entries', function (Blueprint $table) {
            $table->dropConstrainedForeignId('consumption_operation_id');
            $table->dropColumn(['status', 'consumption_mode', 'consumed_at', 'consumption']);
        });
        Schema::dropIfExists('meal_inventory_movements');
        Schema::dropIfExists('meal_preparations');
        Schema::dropIfExists('meal_inventory_operations');
    }
};
