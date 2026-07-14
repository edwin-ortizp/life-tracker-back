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
            $table->timestamp('completed_at')->nullable()->after('completed');
            $table->unsignedSmallInteger('completion_xp')->nullable()->after('completed_at');
            $table->index(['user_id', 'completed_at']);
        });

        foreach (DB::table('tasks')->where('completed', true)->cursor() as $task) {
            $baseXp = ['XS' => 1, 'S' => 2, 'M' => 4, 'L' => 6, 'XL' => 9][$task->size] ?? 1;
            $xp = in_array($task->priority, ['urgent-important', 'not-urgent-important'], true) ? $baseXp * 2 : $baseXp;

            DB::table('tasks')->where('id', $task->id)->update([
                'completed_at' => $task->updated_at,
                'completion_xp' => $xp,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'completed_at']);
            $table->dropColumn(['completed_at', 'completion_xp']);
        });
    }
};
