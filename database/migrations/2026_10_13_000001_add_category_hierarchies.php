<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = ['task_categories', 'plan_categories', 'meal_categories', 'vehicle_expense_categories'];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                $blueprint->uuid('parent_id')->nullable()->index();
                $blueprint->unique(['id', 'user_id'], $table.'_hierarchy_owner_unique');
                // Restrict deletion at DB level, including query-builder writes.
                $blueprint->foreign(['parent_id', 'user_id'])->references(['id', 'user_id'])->on($table)->restrictOnDelete();
            });
        }
        Schema::create('user_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('domain', 40);
            $table->string('key', 255);
            $table->string('name');
            $table->string('normalized_name');
            $table->uuid('parent_id')->nullable()->index();
            $table->unique(['id', 'user_id', 'domain'], 'user_category_hierarchy_owner_unique');
            $table->foreign(['parent_id', 'user_id', 'domain'])->references(['id', 'user_id', 'domain'])->on('user_categories')->restrictOnDelete();
            $table->unique(['user_id', 'domain', 'key']);
            $table->unique(['user_id', 'domain', 'normalized_name'], 'user_category_name_unique');
            $table->timestamps();
        });
        DB::table('users')->orderBy('id')->each(fn ($user) => \App\Support\CategoryCatalog::seedFor($user->id));
    }

    public function down(): void
    {
        // Preserve custom/renamed labels in the legacy text field on rollback.
        // Untouched defaults retain their original interoperable keys.
        DB::table('user_categories')->orderBy('id')->each(function ($category) {
            $default = \App\Support\CategoryCatalog::defaults($category->domain)[$category->key] ?? $category->key;
            if ($category->name !== $default) {
                $table = \App\Support\CategoryCatalog::DOMAINS[$category->domain][0];
                DB::table($table)->where('user_id', $category->user_id)->where('category', $category->key)->update(['category' => $category->name]);
            }
        });
        Schema::dropIfExists('user_categories');
        foreach (array_reverse($this->tables) as $table) {
            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                $blueprint->dropForeign(['parent_id', 'user_id']);
                $blueprint->dropIndex(['parent_id']);
                $blueprint->dropUnique($table.'_hierarchy_owner_unique');
                $blueprint->dropColumn('parent_id');
            });
        }
    }
};
