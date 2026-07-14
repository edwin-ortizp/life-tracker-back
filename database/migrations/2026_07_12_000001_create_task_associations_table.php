<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Move task context into one extensible, polymorphic association table.
     */
    public function up(): void
    {
        Schema::create('task_association_staging', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('task_id');
            $table->string('target_type');
            $table->uuid('target_id');
            $table->timestamps();
            $table->unique(
                ['user_id', 'task_id', 'target_type', 'target_id'],
                'task_assoc_staging_unique'
            );
        });

        $now = now();

        foreach (DB::table('tasks')->whereNotNull('goal_id')->cursor() as $task) {
            DB::table('task_association_staging')->insert([
                'id' => (string) Str::uuid(),
                'user_id' => $task->user_id,
                'task_id' => $task->id,
                'target_type' => 'goal',
                'target_id' => $task->goal_id,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        foreach (DB::table('relationship_tasks')->cursor() as $association) {
            DB::table('task_association_staging')->insert([
                'id' => (string) Str::uuid(),
                'user_id' => $association->user_id,
                'task_id' => $association->task_id,
                'target_type' => 'relationship',
                'target_id' => $association->relationship_id,
                'created_at' => $association->created_at ?? $now,
                'updated_at' => $association->updated_at ?? $now,
            ]);
        }

        Schema::dropIfExists('relationship_tasks');

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['goal_id', 'user_id']);
            $table->dropColumn('goal_id');
        });

        Schema::create('task_associations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('task_id');
            $table->string('target_type');
            $table->uuid('target_id');
            $table->timestamps();

            $table->foreign(['task_id', 'user_id'])
                ->references(['id', 'user_id'])
                ->on('tasks')
                ->cascadeOnDelete();
            $table->unique(
                ['user_id', 'task_id', 'target_type', 'target_id'],
                'task_assoc_unique'
            );
            $table->index(['user_id', 'target_type', 'target_id'], 'task_assoc_target_index');
            $table->index(['user_id', 'task_id'], 'task_assoc_task_index');
        });

        foreach (DB::table('task_association_staging')->cursor() as $association) {
            DB::table('task_associations')->insert([
                'id' => $association->id,
                'user_id' => $association->user_id,
                'task_id' => $association->task_id,
                'target_type' => $association->target_type,
                'target_id' => $association->target_id,
                'created_at' => $association->created_at,
                'updated_at' => $association->updated_at,
            ]);
        }

        Schema::dropIfExists('task_association_staging');
    }

    public function down(): void
    {
        Schema::create('task_association_staging', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('task_id');
            $table->string('target_type');
            $table->uuid('target_id');
            $table->timestamps();
            $table->unique(
                ['user_id', 'task_id', 'target_type', 'target_id'],
                'task_assoc_staging_unique'
            );
        });

        foreach (DB::table('task_associations')->cursor() as $association) {
            DB::table('task_association_staging')->insert([
                'id' => $association->id,
                'user_id' => $association->user_id,
                'task_id' => $association->task_id,
                'target_type' => $association->target_type,
                'target_id' => $association->target_id,
                'created_at' => $association->created_at,
                'updated_at' => $association->updated_at,
            ]);
        }

        Schema::dropIfExists('task_associations');

        Schema::table('tasks', function (Blueprint $table) {
            $table->uuid('goal_id')->nullable()->after('user_id');
        });

        foreach (DB::table('task_association_staging')->where('target_type', 'goal')->cursor() as $association) {
            DB::table('tasks')
                ->where('id', $association->task_id)
                ->where('user_id', $association->user_id)
                ->update(['goal_id' => $association->target_id]);
        }

        Schema::table('tasks', function (Blueprint $table) {
            $table->foreign(['goal_id', 'user_id'])
                ->references(['id', 'user_id'])
                ->on('goals')
                ->restrictOnDelete();
        });

        Schema::create('relationship_tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('relationship_id');
            $table->uuid('task_id');
            $table->timestamps();

            $table->foreign(['relationship_id', 'user_id'])
                ->references(['id', 'user_id'])
                ->on('relationships')
                ->cascadeOnDelete();
            $table->foreign(['task_id', 'user_id'])
                ->references(['id', 'user_id'])
                ->on('tasks')
                ->cascadeOnDelete();
            $table->unique(['user_id', 'relationship_id', 'task_id']);
        });

        foreach (DB::table('task_association_staging')->where('target_type', 'relationship')->cursor() as $association) {
            DB::table('relationship_tasks')->insert([
                'id' => (string) Str::uuid(),
                'user_id' => $association->user_id,
                'relationship_id' => $association->target_id,
                'task_id' => $association->task_id,
                'created_at' => $association->created_at,
                'updated_at' => $association->updated_at,
            ]);
        }

        Schema::dropIfExists('task_association_staging');
    }
};
