<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\DefaultHabitDefinitions;
use Illuminate\Database\Seeder;

class NegativeHabitDefinitionSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->each(fn (User $user) => DefaultHabitDefinitions::createNegativeFor($user));
    }
}
