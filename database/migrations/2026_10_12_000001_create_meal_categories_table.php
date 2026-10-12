<?php

use App\Models\ShoppingItem;
use App\Services\Meal\CatalogNames;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meal_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('key');
            $table->string('name');
            $table->string('normalized_name');
            $table->timestamps();
            $table->unique(['user_id', 'key']);
            $table->unique(['user_id', 'normalized_name']);
            $table->unique(['id', 'user_id']);
        });
        Schema::table('shopping_items', function (Blueprint $table) {
            $table->uuid('category_id')->nullable();
            $table->foreign(['category_id', 'user_id'])->references(['id', 'user_id'])->on('meal_categories')->restrictOnDelete();
        });
        DB::table('users')->orderBy('id')->chunkById(100, function ($users) {
            foreach ($users as $user) {
                $options = ShoppingItem::CATEGORIES;
                foreach (DB::table('shopping_items')->where('user_id', $user->id)->whereNotNull('category')->distinct()->pluck('category') as $key) {
                    if ($key !== '' && ! array_key_exists($key, $options)) {
                        $options[$key] = $key;
                    }
                }
                foreach ($options as $key => $name) {
                    // Existing category keys are preserved verbatim, including legacy custom values.
                    $normalized = CatalogNames::normalize($name);
                    if (DB::table('meal_categories')->where('user_id', $user->id)->where('normalized_name', $normalized)->exists()) {
                        $normalized = Str::limit($normalized, 210, '').' '.sha1($key);
                    }
                    $id = (string) Str::uuid();
                    DB::table('meal_categories')->insert([
                        'id' => $id, 'user_id' => $user->id, 'key' => $key,
                        'name' => $name, 'normalized_name' => $normalized,
                        'created_at' => now(), 'updated_at' => now(),
                    ]);
                    DB::table('shopping_items')->where('user_id', $user->id)->where('category', $key)->update(['category_id' => $id]);
                }
            }
        });
        Schema::table('shopping_items', fn (Blueprint $table) => $table->dropColumn('category'));
    }

    public function down(): void
    {
        Schema::table('shopping_items', fn (Blueprint $table) => $table->string('category')->nullable());
        DB::table('meal_categories')->orderBy('id')->chunkById(100, function ($categories) {
            foreach ($categories as $category) {
                DB::table('shopping_items')->where('user_id', $category->user_id)->where('category_id', $category->id)->update(['category' => $category->key]);
            }
        });
        Schema::table('shopping_items', function (Blueprint $table) {
            $table->dropForeign(['category_id', 'user_id']);
            $table->dropColumn('category_id');
        });
        Schema::dropIfExists('meal_categories');
    }
};
