<?php

namespace App\Support;

use App\Models\User;

/**
 * Catálogo base de tipos de ejercicio. Las calorías por hora parten de los MET del
 * Compendium of Physical Activities para una persona de ~70 kg; son estimaciones que
 * cada usuario puede ajustar. `aliases` evita duplicar un tipo que la cuenta ya tiene
 * con un nombre anterior (p. ej. «Caminata» cubre «Caminar»).
 */
class DefaultExerciseTypes
{
    public const CATEGORIES = [
        'cardio' => 'Cardio',
        'sports' => 'Deportes',
        'strength' => 'Fuerza',
        'flexibility' => 'Flexibilidad',
    ];

    /** @return list<array{name: string, calories_per_hour: int, steps_equivalent: int, category: string, icon: string, legacy_id: ?int, aliases: list<string>}> */
    public static function all(): array
    {
        return [
            ['name' => 'Pasos', 'calories_per_hour' => 200, 'steps_equivalent' => 1312, 'category' => 'cardio', 'icon' => '👣', 'legacy_id' => 1, 'aliases' => []],
            ['name' => 'Caminar', 'calories_per_hour' => 250, 'steps_equivalent' => 1400, 'category' => 'cardio', 'icon' => '🚶', 'legacy_id' => 4, 'aliases' => ['Caminata']],
            ['name' => 'Trotar', 'calories_per_hour' => 500, 'steps_equivalent' => 1200, 'category' => 'cardio', 'icon' => '🏃', 'legacy_id' => 2, 'aliases' => []],
            ['name' => 'Correr', 'calories_per_hour' => 700, 'steps_equivalent' => 1500, 'category' => 'cardio', 'icon' => '🏃‍♂️', 'legacy_id' => null, 'aliases' => []],
            ['name' => 'Senderismo', 'calories_per_hour' => 420, 'steps_equivalent' => 1300, 'category' => 'cardio', 'icon' => '🥾', 'legacy_id' => null, 'aliases' => []],
            ['name' => 'Bicicleta', 'calories_per_hour' => 450, 'steps_equivalent' => 0, 'category' => 'cardio', 'icon' => '🚲', 'legacy_id' => 3, 'aliases' => []],
            ['name' => 'Bicicleta estática', 'calories_per_hour' => 480, 'steps_equivalent' => 0, 'category' => 'cardio', 'icon' => '🚴', 'legacy_id' => null, 'aliases' => []],
            ['name' => 'Elíptica', 'calories_per_hour' => 350, 'steps_equivalent' => 0, 'category' => 'cardio', 'icon' => '🏃‍♀️', 'legacy_id' => null, 'aliases' => []],
            ['name' => 'Natación', 'calories_per_hour' => 550, 'steps_equivalent' => 0, 'category' => 'cardio', 'icon' => '🏊', 'legacy_id' => 5, 'aliases' => []],
            ['name' => 'Tenis', 'calories_per_hour' => 500, 'steps_equivalent' => 0, 'category' => 'sports', 'icon' => '🎾', 'legacy_id' => 6, 'aliases' => []],
            ['name' => 'Fútbol', 'calories_per_hour' => 490, 'steps_equivalent' => 0, 'category' => 'sports', 'icon' => '⚽', 'legacy_id' => null, 'aliases' => ['Futbol']],
            ['name' => 'Baloncesto', 'calories_per_hour' => 450, 'steps_equivalent' => 0, 'category' => 'sports', 'icon' => '🏀', 'legacy_id' => null, 'aliases' => ['Básquetbol', 'Basketball']],
            ['name' => 'Entrenamiento de fuerza', 'calories_per_hour' => 350, 'steps_equivalent' => 0, 'category' => 'strength', 'icon' => '🏋️', 'legacy_id' => null, 'aliases' => ['Gimnasio']],
            ['name' => 'Pesas de mano', 'calories_per_hour' => 250, 'steps_equivalent' => 0, 'category' => 'strength', 'icon' => '🏋️', 'legacy_id' => 8, 'aliases' => []],
            ['name' => 'Flexiones de pecho', 'calories_per_hour' => 350, 'steps_equivalent' => 0, 'category' => 'strength', 'icon' => '💪', 'legacy_id' => 9, 'aliases' => ['Flexiones']],
            ['name' => 'Sentadillas', 'calories_per_hour' => 400, 'steps_equivalent' => 0, 'category' => 'strength', 'icon' => '🏋️', 'legacy_id' => 10, 'aliases' => []],
            ['name' => 'Abdominales', 'calories_per_hour' => 300, 'steps_equivalent' => 0, 'category' => 'strength', 'icon' => '💪', 'legacy_id' => 7, 'aliases' => []],
            ['name' => 'Burpees', 'calories_per_hour' => 700, 'steps_equivalent' => 0, 'category' => 'strength', 'icon' => '💥', 'legacy_id' => 11, 'aliases' => []],
            ['name' => 'Yoga', 'calories_per_hour' => 250, 'steps_equivalent' => 0, 'category' => 'flexibility', 'icon' => '🧘', 'legacy_id' => 12, 'aliases' => []],
            ['name' => 'Pilates', 'calories_per_hour' => 210, 'steps_equivalent' => 0, 'category' => 'flexibility', 'icon' => '🤸‍♀️', 'legacy_id' => null, 'aliases' => []],
            ['name' => 'Estiramientos', 'calories_per_hour' => 150, 'steps_equivalent' => 0, 'category' => 'flexibility', 'icon' => '🤸', 'legacy_id' => 13, 'aliases' => []],
        ];
    }

    public static function categoryLabel(?string $category): string
    {
        return self::CATEGORIES[$category] ?? ($category ? ucfirst($category) : 'Sin categoría');
    }

    /**
     * Crea los tipos base que falten en la cuenta. Nunca modifica ni borra los existentes.
     *
     * @return int Tipos creados.
     */
    public static function createFor(User $user): int
    {
        $existing = $user->exerciseTypes()->withoutGlobalScopes()->pluck('name')
            ->map(fn (string $name) => mb_strtolower($name))
            ->all();

        $created = 0;

        foreach (self::all() as $definition) {
            $names = array_map('mb_strtolower', [$definition['name'], ...$definition['aliases']]);

            if (array_intersect($names, $existing)) {
                continue;
            }

            $user->exerciseTypes()->create(collect($definition)->except('aliases')->all());
            $existing[] = mb_strtolower($definition['name']);
            $created++;
        }

        return $created;
    }
}
