<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->unsignedBigInteger('flow_position')->default(0)->after('category');
            $table->index(['user_id', 'category', 'flow_position'], 'tasks_user_category_flow_position_index');
        });

        DB::table('tasks')
            ->select('user_id', 'category')
            ->distinct()
            ->orderBy('user_id')
            ->orderBy('category')
            ->each(function (object $lane): void {
                $query = DB::table('tasks')->where('user_id', $lane->user_id);

                if ($lane->category === null) {
                    $query->whereNull('category');
                } else {
                    $query->where('category', $lane->category);
                }

                $position = 1;
                $query->orderBy('created_at')->orderBy('id')->each(function (object $task) use (&$position): void {
                    DB::table('tasks')->where('id', $task->id)->update(['flow_position' => $position++]);
                });
            });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex('tasks_user_category_flow_position_index');
            $table->dropColumn('flow_position');
        });
    }
};
