<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Un evento de salud puede relacionarse con varias zonas del cuerpo:
 * `details.body_area` pasa a la lista `details.body_areas`.
 */
return new class extends Migration
{
    public function up(): void
    {
        $this->rewrite(function (array $details): array {
            if (! array_key_exists('body_area', $details)) {
                return $details;
            }
            $area = $details['body_area'];
            unset($details['body_area']);
            if (filled($area)) {
                $details['body_areas'] = [$area];
            }

            return $details;
        });
    }

    public function down(): void
    {
        $this->rewrite(function (array $details): array {
            if (! array_key_exists('body_areas', $details)) {
                return $details;
            }
            $areas = (array) $details['body_areas'];
            unset($details['body_areas']);
            if ($areas !== []) {
                $details['body_area'] = reset($areas);
            }

            return $details;
        });
    }

    private function rewrite(callable $transform): void
    {
        DB::table('health_events')
            ->whereNotNull('details')
            ->orderBy('id')
            ->each(function (object $event) use ($transform): void {
                $details = json_decode($event->details, true) ?: [];
                $updated = $transform($details);
                if ($updated !== $details) {
                    DB::table('health_events')->where('id', $event->id)->update(['details' => json_encode($updated)]);
                }
            });
    }
};
