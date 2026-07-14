<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\DefaultHabitDefinitions;
use Illuminate\Database\Seeder;

class HabitDefinitionSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->each(fn (User $user) => DefaultHabitDefinitions::createPositiveFor($user));
    }
}
