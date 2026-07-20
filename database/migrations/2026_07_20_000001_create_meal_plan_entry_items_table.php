<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meal_plan_entry_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('meal_plan_entry_id')->constrained()->cascadeOnDelete();
            $table->uuid('recipe_id')->nullable();
            $table->string('name')->nullable();
            $table->decimal('portions', 8, 2)->nullable();
            $table->integer('calories')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->foreign(['recipe_id', 'user_id'])
                ->references(['id', 'user_id'])
                ->on('recipes')
                ->restrictOnDelete();
            $table->unique(['user_id', 'meal_plan_entry_id', 'recipe_id'], 'meal_entry_recipe_unique');
            $table->index(['meal_plan_entry_id', 'position']);
        });

        $recipeNames = DB::table('recipes')->pluck('name', 'id');
        $now = now();

        DB::table('meal_plan_entries')->orderBy('id')->each(function ($entry) use ($recipeNames, $now) {
            $position = 0;

            if ($entry->recipe_id) {
                DB::table('meal_plan_entry_items')->insert([
                    'user_id' => $entry->user_id,
                    'meal_plan_entry_id' => $entry->id,
                    'recipe_id' => $entry->recipe_id,
                    'name' => null,
                    'portions' => 1,
                    'calories' => null,
                    'position' => $position++,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $entryName = trim((string) $entry->name);
            $recipeName = $entry->recipe_id ? trim((string) ($recipeNames[$entry->recipe_id] ?? '')) : '';

            if ($entryName !== '' && (!$entry->recipe_id || mb_strtolower($entryName) !== mb_strtolower($recipeName))) {
                DB::table('meal_plan_entry_items')->insert([
                    'user_id' => $entry->user_id,
                    'meal_plan_entry_id' => $entry->id,
                    'recipe_id' => null,
                    'name' => $entryName,
                    'portions' => null,
                    'calories' => null,
                    'position' => $position,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        });

        Schema::table('meal_plan_entries', function (Blueprint $table) {
            $table->dropForeign(['recipe_id', 'user_id']);
            $table->dropColumn(['recipe_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::table('meal_plan_entries', function (Blueprint $table) {
            $table->uuid('recipe_id')->nullable()->after('meal_type');
            $table->string('name')->nullable()->after('recipe_id');
        });

        DB::table('meal_plan_entries')->orderBy('id')->each(function ($entry) {
            $items = DB::table('meal_plan_entry_items')
                ->where('meal_plan_entry_id', $entry->id)
                ->orderBy('position')
                ->get();
            $recipe = $items->firstWhere('recipe_id', '!=', null);
            $names = $items->map(function ($item) {
                if ($item->recipe_id) {
                    return DB::table('recipes')->where('id', $item->recipe_id)->value('name');
                }

                return $item->name;
            })->filter()->implode(' + ');

            DB::table('meal_plan_entries')->where('id', $entry->id)->update([
                'recipe_id' => $recipe?->recipe_id,
                'name' => $names ?: null,
            ]);
        });

        Schema::dropIfExists('meal_plan_entry_items');

        Schema::table('meal_plan_entries', function (Blueprint $table) {
            $table->foreign(['recipe_id', 'user_id'])
                ->references(['id', 'user_id'])
                ->on('recipes')
                ->restrictOnDelete();
        });
    }
};
