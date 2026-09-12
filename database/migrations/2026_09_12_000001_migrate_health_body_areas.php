<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Las zonas del cuerpo pasan de 16 áreas generales a las zonas con lado del mapa
 * corporal. Las áreas sin lado se asignan al derecho y se anota el cambio.
 */
return new class extends Migration
{
    private const MAP = [
        'back' => 'lower_back',
        'shoulders' => 'shoulder_right',
        'arms' => 'arm_right',
        'hands' => 'hand_right',
        'hips_pelvis' => 'glutes',
        'legs' => 'leg_right',
        'knees' => 'knee_right',
        'feet_ankles' => 'ankle_right',
    ];

    private const BILATERAL = ['shoulders', 'arms', 'hands', 'legs', 'knees', 'feet_ankles'];

    private const NOTE = 'Ambos lados (migrado)';

    public function up(): void
    {
        $this->rewrite(function (array $details): array {
            $area = $details['body_area'] ?? null;
            if (! isset(self::MAP[$area])) {
                return $details;
            }
            $details['body_area'] = self::MAP[$area];
            if (in_array($area, self::BILATERAL, true) && empty($details['body_area_note'])) {
                $details['body_area_note'] = self::NOTE;
            }

            return $details;
        });
    }

    public function down(): void
    {
        $reverse = array_flip(self::MAP);
        $this->rewrite(function (array $details) use ($reverse): array {
            $area = $details['body_area'] ?? null;
            if (! isset($reverse[$area])) {
                return $details;
            }
            $details['body_area'] = $reverse[$area];
            if (($details['body_area_note'] ?? null) === self::NOTE) {
                unset($details['body_area_note']);
            }

            return $details;
        });
    }

    private function rewrite(callable $transform): void
    {
        DB::table('health_events')
            ->where('type', 'symptom')
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
