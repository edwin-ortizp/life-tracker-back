<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::factory()->create([
            'name' => 'Alexander Ortiz',
            'email' => 'edwin.ortizp123@gmail.com',
        ]);

        $this->call([
            MaintenanceTemplateSeeder::class,
            HabitDefinitionSeeder::class,
            NegativeHabitDefinitionSeeder::class,
        ]);
    }
}
