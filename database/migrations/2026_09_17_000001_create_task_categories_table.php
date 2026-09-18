<?php

use App\Support\DefaultTaskCategories;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('key', 80);
            $table->string('name', 60);
            $table->string('icon', 40)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'key'], 'task_category_key_unique');
            $table->unique(['user_id', 'name'], 'task_category_name_unique');
        });

        // Cada cuenta recibe el catálogo base más cualquier categoría que ya use en sus tareas.
        $now = now();
        DB::table('users')->orderBy('id')->pluck('id')->chunk(200)->each(function ($userIds) use ($now) {
            $rows = [];
            foreach ($userIds as $userId) {
                $keys = [];
                $names = [];
                foreach (DefaultTaskCategories::all() as $category) {
                    $keys[] = $category['key'];
                    $names[] = mb_strtolower($category['name']);
                    $rows[] = ['id' => (string) Str::uuid(), 'user_id' => $userId, ...$category,
                        'sort_order' => count($keys), 'created_at' => $now, 'updated_at' => $now];
                }
                $used = DB::table('tasks')->where('user_id', $userId)->whereNotNull('category')->where('category', '!=', '')
                    ->distinct()->pluck('category');
                foreach ($used as $key) {
                    $name = DefaultTaskCategories::labelFor($key);
                    if (in_array($key, $keys, true) || in_array(mb_strtolower($name), $names, true)) {
                        continue;
                    }
                    $keys[] = $key;
                    $names[] = mb_strtolower($name);
                    $rows[] = ['id' => (string) Str::uuid(), 'user_id' => $userId, 'key' => $key, 'name' => $name, 'icon' => 'bi-tag',
                        'sort_order' => count($keys), 'created_at' => $now, 'updated_at' => $now];
                }
            }
            if ($rows) {
                DB::table('task_categories')->insert($rows);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_categories');
    }
};
