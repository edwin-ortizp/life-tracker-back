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
        Schema::table('integration_tokens', function (Blueprint $table): void {
            $table->string('purpose')->default('obsidian')->after('user_id');
            $table->index(['user_id', 'purpose', 'revoked_at']);
        });

        Schema::table('tasks', function (Blueprint $table): void {
            $table->string('caldav_uid')->nullable()->after('id');
            $table->string('caldav_uri')->nullable()->after('caldav_uid');
            $table->longText('caldav_data')->nullable()->after('caldav_uri');
            $table->unsignedBigInteger('caldav_revision')->default(1)->after('caldav_data');
            $table->boolean('start_is_date')->default(true)->after('start_date');
            $table->boolean('end_is_date')->default(true)->after('end_date');
            $table->uuid('recurrence_series_id')->nullable()->after('recurrence');
            $table->boolean('is_recurrence_history')->default(false)->after('recurrence_series_id');

            $table->unique(['user_id', 'caldav_uid']);
            $table->unique(['user_id', 'caldav_uri']);
            $table->index(['user_id', 'is_recurrence_history']);
        });

        DB::table('tasks')->where('is_recurrent', true)->where('completed', true)->update([
            'is_recurrent' => false,
            'is_recurrence_history' => true,
        ]);

        DB::table('tasks')->orderBy('id')->each(function (object $task): void {
            $updates = [
                'start_is_date' => ! $task->start_date || str_ends_with((string) $task->start_date, '00:00:00'),
                'end_is_date' => ! $task->end_date || str_ends_with((string) $task->end_date, '00:00:00'),
            ];

            if ($task->is_recurrent && ! $task->completed) {
                $recurrence = json_decode($task->recurrence ?: '{}', true) ?: [];
                $frequency = max(1, (int) ($recurrence['frequency'] ?? 1));
                $interval = match ($recurrence['pattern'] ?? 'custom') {
                    'daily', 'weekly', 'monthly' => $frequency,
                    default => max(1, (int) ($recurrence['customDays'] ?? $frequency)),
                };
                $recurrence['rrule'] = match ($recurrence['pattern'] ?? 'custom') {
                    'weekly' => 'FREQ=WEEKLY;INTERVAL='.$interval,
                    'monthly' => 'FREQ=MONTHLY;INTERVAL='.$interval,
                    default => 'FREQ=DAILY;INTERVAL='.$interval,
                };
                $recurrence['anchor'] = $task->start_date ?: ($task->end_date ?: now()->toIso8601String());
                $recurrence['occurrences_completed'] = 0;
                $updates['recurrence'] = json_encode($recurrence, JSON_THROW_ON_ERROR);
                $updates['recurrence_series_id'] = (string) Str::uuid();
            }

            DB::table('tasks')->where('id', $task->id)->update($updates);
        });

        Schema::create('caldav_changes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('task_id')->nullable();
            $table->string('uri');
            $table->string('operation', 12);
            $table->timestamps();

            $table->index(['user_id', 'id']);
            $table->index(['user_id', 'uri', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('caldav_changes');

        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropUnique(['user_id', 'caldav_uid']);
            $table->dropUnique(['user_id', 'caldav_uri']);
            $table->dropIndex(['user_id', 'is_recurrence_history']);
            $table->dropColumn([
                'caldav_uid', 'caldav_uri', 'caldav_data', 'caldav_revision',
                'start_is_date', 'end_is_date', 'recurrence_series_id', 'is_recurrence_history',
            ]);
        });

        Schema::table('integration_tokens', function (Blueprint $table): void {
            $table->dropIndex(['user_id', 'purpose', 'revoked_at']);
            $table->dropColumn('purpose');
        });
    }
};
