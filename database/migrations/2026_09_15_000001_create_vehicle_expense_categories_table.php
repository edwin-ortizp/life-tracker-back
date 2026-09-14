<?php

use App\Support\DefaultVehicleExpenseCategories;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_expense_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 60);
            $table->string('icon', 40)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'name'], 'vehicle_expense_category_name_unique');
            $table->unique(['id', 'user_id'], 'vehicle_expense_category_id_user_unique');
        });

        // Las cuentas existentes arrancan con el catálogo base; las nuevas lo reciben al registrarse.
        $now = now();
        DB::table('users')->orderBy('id')->pluck('id')->chunk(200)->each(function ($userIds) use ($now) {
            $rows = [];
            foreach ($userIds as $userId) {
                foreach (DefaultVehicleExpenseCategories::all() as $index => $category) {
                    $rows[] = ['id' => (string) Str::uuid(), 'user_id' => $userId, 'name' => $category['name'], 'icon' => $category['icon'],
                        'sort_order' => $index, 'created_at' => $now, 'updated_at' => $now];
                }
            }
            DB::table('vehicle_expense_categories')->insert($rows);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_expense_categories');
    }
};
