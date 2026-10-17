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
        Schema::create('task_statuses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 60);
            // todo | ready | in_progress | done. Solo puede haber un done por usuario (lo valida la aplicación).
            $table->string('type', 20);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'name'], 'task_status_name_unique');
            $table->index(['user_id', 'type']);
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->uuid('status_id')->nullable()->after('completed')->index();
        });

        // Cada cuenta recibe Borrador, Ready, WIP y Done; las tareas existentes se ubican
        // según su avance actual: completadas → Done, con progreso o timer → WIP, el resto → Borrador.
        $now = now();
        DB::table('users')->orderBy('id')->pluck('id')->each(function ($userId) use ($now) {
            $ids = [];
            foreach ([['Borrador', 'todo'], ['Ready', 'ready'], ['WIP', 'in_progress'], ['Done', 'done']] as $index => [$name, $type]) {
                $ids[$type] = (string) Str::uuid();
                DB::table('task_statuses')->insert([
                    'id' => $ids[$type], 'user_id' => $userId, 'name' => $name, 'type' => $type,
                    'sort_order' => 0, 'created_at' => $now, 'updated_at' => $now,
                ]);
            }

            $tasks = DB::table('tasks')->where('user_id', $userId);
            (clone $tasks)->where('completed', true)->update(['status_id' => $ids['done']]);
            (clone $tasks)->where('completed', false)
                ->where(fn ($query) => $query->where('progress', '>', 0)->orWhere('timer_active', true))
                ->update(['status_id' => $ids['in_progress']]);
            (clone $tasks)->whereNull('status_id')->update(['status_id' => $ids['todo']]);
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['status_id']);
            $table->dropColumn('status_id');
        });

        Schema::dropIfExists('task_statuses');
    }
};
