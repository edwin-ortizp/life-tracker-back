<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NegativeHabitDefinitionSeeder extends Seeder
{
    public function run(): void
    {
        $habits = [
            // Health
            ['id' => 1, 'name' => 'Saltarse comidas', 'icon' => '🍽️', 'category' => 'health', 'description' => null],
            ['id' => 2, 'name' => 'Dormir poco', 'icon' => '😴', 'category' => 'health', 'description' => null],
            ['id' => 3, 'name' => 'No hacer ejercicio', 'icon' => '🏃', 'category' => 'health', 'description' => null],
            ['id' => 4, 'name' => 'Comer en exceso', 'icon' => '🫃🏻', 'category' => 'health', 'description' => null],
            ['id' => 25, 'name' => 'Comida chatarra', 'icon' => '🍔', 'category' => 'health', 'description' => null],
            ['id' => 26, 'name' => 'Exceso de azúcar', 'icon' => '🍭', 'category' => 'health', 'description' => null],
            ['id' => 27, 'name' => 'Masturbación', 'icon' => '🍆', 'category' => 'health', 'description' => null],

            // Productivity
            ['id' => 5, 'name' => 'Procrastinar', 'icon' => '⏰', 'category' => 'productivity', 'description' => null],
            ['id' => 6, 'name' => 'Distracciones', 'icon' => '🎯', 'category' => 'productivity', 'description' => null],
            ['id' => 7, 'name' => 'Multitarea', 'icon' => '🔄', 'category' => 'productivity', 'description' => null],
            ['id' => 8, 'name' => 'Desorganización', 'icon' => '📋', 'category' => 'productivity', 'description' => null],
            ['id' => 24, 'name' => 'Exceso de trabajo (Workaholic)', 'icon' => '🍽️', 'category' => 'productivity', 'description' => null],

            // Social
            ['id' => 9, 'name' => 'Aislamiento', 'icon' => '🚶', 'category' => 'social', 'description' => null],
            ['id' => 10, 'name' => 'Conflictos', 'icon' => '💢', 'category' => 'social', 'description' => null],
            ['id' => 11, 'name' => 'No escuchar', 'icon' => '👂', 'category' => 'social', 'description' => null],
            ['id' => 29, 'name' => 'Dejar en visto', 'icon' => '👀', 'category' => 'social', 'description' => null],

            // Emotional
            ['id' => 15, 'name' => 'Sobrepensar cosas', 'icon' => '😰', 'category' => 'emotional', 'description' => null],
            ['id' => 16, 'name' => 'Negatividad / Pesimismo', 'icon' => '🌧️', 'category' => 'emotional', 'description' => null],
            ['id' => 17, 'name' => 'Ser grosero/estresarme', 'icon' => '🤬', 'category' => 'emotional', 'description' => null],
            ['id' => 28, 'name' => 'Celos compulsivos', 'icon' => '💁🏻‍♂️', 'category' => 'emotional', 'description' => null],

            // Finance
            ['id' => 12, 'name' => 'Gastos impulsivos', 'icon' => '💳', 'category' => 'finance', 'description' => null],
            ['id' => 13, 'name' => 'No ahorrar', 'icon' => '💰', 'category' => 'finance', 'description' => null],
            ['id' => 14, 'name' => 'Más Deudas', 'icon' => '📉', 'category' => 'finance', 'description' => null],

            // Digital
            ['id' => 18, 'name' => 'Exceso de Redes sociales', 'icon' => '📱', 'category' => 'digital', 'description' => null],
            ['id' => 19, 'name' => 'Exceso de Videojuegos', 'icon' => '🎮', 'category' => 'digital', 'description' => null],
            ['id' => 20, 'name' => 'Exceso de Netflix', 'icon' => '🎬', 'category' => 'digital', 'description' => null],

            // Environment
            ['id' => 21, 'name' => 'Desperdiciar agua', 'icon' => '💧', 'category' => 'environment', 'description' => null],
            ['id' => 22, 'name' => 'No reciclar', 'icon' => '♻️', 'category' => 'environment', 'description' => null],
            ['id' => 23, 'name' => 'Consumo excesivo', 'icon' => '🛍️', 'category' => 'environment', 'description' => null],
        ];

        DB::table('negative_habit_definitions')->insertOrIgnore($habits);
    }
}
