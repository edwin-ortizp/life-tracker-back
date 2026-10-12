<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 80);
            $table->string('normalized_name', 80);
            $table->string('icon', 60)->default('bi-grid');
            $table->timestamps();
            $table->unique(['id', 'user_id']);
            $table->unique(['user_id', 'normalized_name']);
        });
        Schema::table('plans', function (Blueprint $table) {
            $table->uuid('plan_category_id')->nullable();
            $table->foreign(['plan_category_id', 'user_id'])->references(['id', 'user_id'])->on('plan_categories')->restrictOnDelete();
        });
        DB::table('plans')->orderBy('id')->chunk(200, function ($plans) {
            foreach ($plans as $plan) {
                $name = preg_replace('/\s+/u', ' ', trim($plan->category ?? ''));
                if ($name === '') {
                    continue;
                }
                $key = Str::lower($name);
                $category = DB::table('plan_categories')->where('user_id', $plan->user_id)->where('normalized_name', $key)->first();
                if (! $category) {
                    $id = (string) Str::uuid();
                    DB::table('plan_categories')->insert(['id' => $id, 'user_id' => $plan->user_id, 'name' => $name, 'normalized_name' => $key, 'icon' => 'bi-grid', 'created_at' => now(), 'updated_at' => now()]);
                    $category = DB::table('plan_categories')->where('id', $id)->first();
                }
                DB::table('plans')->where('id', $plan->id)->update(['plan_category_id' => $category->id, 'category' => $category->name]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropForeign(['plan_category_id', 'user_id']);
            $table->dropColumn('plan_category_id');
        });
        Schema::dropIfExists('plan_categories');
    }
};
