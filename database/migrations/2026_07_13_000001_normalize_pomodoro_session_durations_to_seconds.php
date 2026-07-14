<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('pomodoro_sessions')) {
            return;
        }

        DB::table('pomodoro_sessions')
            ->select(['id', 'start_time', 'end_time'])
            ->orderBy('id')
            ->each(function (object $session): void {
                $start = $this->timestamp($session->start_time);
                $end = $this->timestamp($session->end_time);

                if ($start === null || $end === null || $end < $start) {
                    return;
                }

                $duration = $end - $start;

                // Firebase stored timestamps in milliseconds; Laravel stores them in seconds.
                if ($duration > 172800) {
                    $duration = (int) round($duration / 1000);
                }

                DB::table('pomodoro_sessions')
                    ->where('id', $session->id)
                    ->update(['duration' => $duration]);
            });
    }

    public function down(): void
    {
        // The previous values mixed minutes and seconds, so restoring them is unsafe.
    }

    private function timestamp(mixed $value): ?int
    {
        if (is_string($value)) {
            $value = json_decode($value, true);
        }

        if (! is_array($value) || ! isset($value['timestamp']) || ! is_numeric($value['timestamp'])) {
            return null;
        }

        return (int) $value['timestamp'];
    }
};
