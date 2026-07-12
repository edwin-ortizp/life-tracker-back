<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HabitDefinitionSeeder extends Seeder
{
    public function run(): void
    {
        $habits = [
            // Morning habits (6:00-11:59)
            ['id' => 1, 'name' => 'Tomar Agua (mañana)', 'icon' => '💧', 'time_of_day' => 'morning', 'goal_duration' => '5 min', 'base_time' => '05:50'],
            ['id' => 2, 'name' => 'Ejercicio', 'icon' => '🎾', 'time_of_day' => 'morning', 'goal_duration' => '40 min', 'base_time' => '07:00'],
            ['id' => 3, 'name' => 'Ducha fria', 'icon' => '🚿', 'time_of_day' => 'morning', 'goal_duration' => '10 min', 'base_time' => '08:15'],
            ['id' => 4, 'name' => 'Desayuno', 'icon' => '🍳', 'time_of_day' => 'morning', 'goal_duration' => '30 min', 'base_time' => '08:30'],
            ['id' => 5, 'name' => 'Lavarme los dientes', 'icon' => '🪥', 'time_of_day' => 'morning', 'goal_duration' => '2 min', 'base_time' => '09:00'],
            ['id' => 6, 'name' => 'Seda Dental', 'icon' => '🦷', 'time_of_day' => 'morning', 'goal_duration' => '2 min', 'base_time' => '09:05'],
            ['id' => 7, 'name' => 'Tender la cama', 'icon' => '🛏️', 'time_of_day' => 'morning', 'goal_duration' => '3 min', 'base_time' => '09:10'],
            ['id' => 20, 'name' => 'Lavar loza del desayuno', 'icon' => '🧽', 'time_of_day' => 'morning', 'goal_duration' => '10 min', 'base_time' => '09:15'],
            ['id' => 22, 'name' => 'Aplicarme bloqueador solar', 'icon' => '☀️', 'time_of_day' => 'morning', 'goal_duration' => '5 min', 'base_time' => '09:30'],

            // Afternoon habits (12:00-17:59)
            ['id' => 8, 'name' => 'Almuerzo', 'icon' => '🍽️', 'time_of_day' => 'afternoon', 'goal_duration' => '60 min', 'base_time' => '12:30'],
            ['id' => 9, 'name' => 'Siesta', 'icon' => '🛌', 'time_of_day' => 'afternoon', 'goal_duration' => '15 min', 'base_time' => '13:00'],
            ['id' => 10, 'name' => 'Lavarme los dientes', 'icon' => '🪥', 'time_of_day' => 'afternoon', 'goal_duration' => '2 min', 'base_time' => '13:15'],
            ['id' => 11, 'name' => 'Seda Dental', 'icon' => '🦷', 'time_of_day' => 'afternoon', 'goal_duration' => '2 min', 'base_time' => '13:30'],
            ['id' => 19, 'name' => 'Tomar agua (tarde)', 'icon' => '💧', 'time_of_day' => 'afternoon', 'goal_duration' => '5 min', 'base_time' => '15:00'],

            // Night habits (18:00-22:00)
            ['id' => 12, 'name' => 'Cena', 'icon' => '🍽️', 'time_of_day' => 'night', 'goal_duration' => '30 min', 'base_time' => '19:45'],
            ['id' => 13, 'name' => 'Lavarme los dientes', 'icon' => '🪥', 'time_of_day' => 'night', 'goal_duration' => '2 min', 'base_time' => '20:00'],
            ['id' => 14, 'name' => 'Seda Dental', 'icon' => '🦷', 'time_of_day' => 'night', 'goal_duration' => '2 min', 'base_time' => '20:15'],
            ['id' => 15, 'name' => 'Llevar el diario', 'icon' => '📓', 'time_of_day' => 'night', 'goal_duration' => '10 min', 'base_time' => '20:30'],
            ['id' => 16, 'name' => 'Botar algo que no sirva', 'icon' => '🗑️', 'time_of_day' => 'night', 'goal_duration' => '10 min', 'base_time' => '20:45'],
            ['id' => 17, 'name' => 'Organizar la cocina', 'icon' => '🍴', 'time_of_day' => 'night', 'goal_duration' => '15 min', 'base_time' => '21:00'],
            ['id' => 18, 'name' => 'Lectura', 'icon' => '📚', 'time_of_day' => 'night', 'goal_duration' => '5 min', 'base_time' => '21:15'],
            ['id' => 21, 'name' => 'Lista de pendientes', 'icon' => '📝', 'time_of_day' => 'night', 'goal_duration' => '15 min', 'base_time' => '21:30'],
            ['id' => 23, 'name' => 'Alistar la ropa para mañana', 'icon' => '👕', 'time_of_day' => 'night', 'goal_duration' => '5 min', 'base_time' => '21:45'],
        ];

        DB::table('habit_definitions')->insertOrIgnore($habits);
    }
}
