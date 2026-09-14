<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_expenses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('vehicle_id');
            $table->uuid('vehicle_expense_category_id');
            $table->date('spent_on');
            $table->decimal('amount', 12, 2);
            $table->string('description')->nullable();
            $table->decimal('usage_reading', 12, 2)->nullable();
            $table->string('provider', 120)->nullable();
            $table->timestamps();

            $table->foreign(['vehicle_id', 'user_id'], 'vehicle_expense_vehicle_user_fk')
                ->references(['id', 'user_id'])->on('vehicles')->cascadeOnDelete();
            // La app no elimina categorías con gastos (reasigna antes); la cascada solo cubre el borrado de la cuenta.
            $table->foreign(['vehicle_expense_category_id', 'user_id'], 'vehicle_expense_category_user_fk')
                ->references(['id', 'user_id'])->on('vehicle_expense_categories')->cascadeOnDelete();
            $table->index(['vehicle_id', 'spent_on', 'created_at'], 'vehicle_expense_history_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_expenses');
    }
};
