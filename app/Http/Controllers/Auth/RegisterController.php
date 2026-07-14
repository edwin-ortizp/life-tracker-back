<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\DefaultHabitDefinitions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class RegisterController extends Controller
{
    public function show()
    {
        return view('auth.register');
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $this->seedDefaultUserData($user);

        Auth::login($user);

        return redirect()->route('home');
    }

    private function seedDefaultUserData(User $user): void
    {
        DefaultHabitDefinitions::createFor($user);

        $exerciseTypes = [
            ['name' => 'Pasos', 'calories_per_hour' => 200, 'steps_equivalent' => 1312, 'category' => 'cardio', 'icon' => '👣', 'legacy_id' => 1],
            ['name' => 'Trotar', 'calories_per_hour' => 500, 'steps_equivalent' => 1200, 'category' => 'cardio', 'icon' => '🏃', 'legacy_id' => 2],
            ['name' => 'Bicicleta', 'calories_per_hour' => 450, 'steps_equivalent' => 0, 'category' => 'cardio', 'icon' => '🚲', 'legacy_id' => 3],
            ['name' => 'Caminata', 'calories_per_hour' => 250, 'steps_equivalent' => 1400, 'category' => 'cardio', 'icon' => '🚶', 'legacy_id' => 4],
            ['name' => 'Natación', 'calories_per_hour' => 550, 'steps_equivalent' => 0, 'category' => 'cardio', 'icon' => '🏊', 'legacy_id' => 5],
            ['name' => 'Tenis', 'calories_per_hour' => 500, 'steps_equivalent' => 0, 'category' => 'cardio', 'icon' => '🎾', 'legacy_id' => 6],
            ['name' => 'Abdominales', 'calories_per_hour' => 300, 'steps_equivalent' => 0, 'category' => 'strength', 'icon' => '💪', 'legacy_id' => 7],
            ['name' => 'Pesas de mano', 'calories_per_hour' => 250, 'steps_equivalent' => 0, 'category' => 'strength', 'icon' => '🏋️', 'legacy_id' => 8],
            ['name' => 'Flexiones', 'calories_per_hour' => 350, 'steps_equivalent' => 0, 'category' => 'strength', 'icon' => '💪', 'legacy_id' => 9],
            ['name' => 'Sentadillas', 'calories_per_hour' => 400, 'steps_equivalent' => 0, 'category' => 'strength', 'icon' => '🏋️', 'legacy_id' => 10],
            ['name' => 'Burpees', 'calories_per_hour' => 700, 'steps_equivalent' => 0, 'category' => 'strength', 'icon' => '💥', 'legacy_id' => 11],
            ['name' => 'Yoga', 'calories_per_hour' => 250, 'steps_equivalent' => 0, 'category' => 'flexibility', 'icon' => '🧘', 'legacy_id' => 12],
            ['name' => 'Estiramientos', 'calories_per_hour' => 150, 'steps_equivalent' => 0, 'category' => 'flexibility', 'icon' => '🤸', 'legacy_id' => 13],
        ];

        foreach ($exerciseTypes as $type) {
            $user->exerciseTypes()->create($type);
        }

        $drinkTypes = [
            ['name' => 'Agua', 'hydration_factor' => 1.00, 'color' => '#3b82f6', 'icon' => 'Droplet', 'category' => 'water'],
            ['name' => 'Café', 'hydration_factor' => 0.70, 'color' => '#78350f', 'icon' => 'Coffee', 'category' => 'coffee'],
            ['name' => 'Té', 'hydration_factor' => 0.85, 'color' => '#84cc16', 'icon' => 'Coffee', 'category' => 'tea'],
            ['name' => 'Jugo', 'hydration_factor' => 0.80, 'color' => '#f97316', 'icon' => 'Apple', 'category' => 'juice'],
            ['name' => 'Gaseosa', 'hydration_factor' => 0.50, 'color' => '#a3a3a3', 'icon' => 'Wine', 'category' => 'soda'],
            ['name' => 'Leche', 'hydration_factor' => 0.85, 'color' => '#e5e5e5', 'icon' => 'Milk', 'category' => 'milk'],
            ['name' => 'Bebida Deportiva', 'hydration_factor' => 0.90, 'color' => '#06b6d4', 'icon' => 'Zap', 'category' => 'sports'],
            ['name' => 'Cerveza', 'hydration_factor' => 0.60, 'color' => '#fbbf24', 'icon' => 'Beer', 'category' => 'beer'],
            ['name' => 'Vino', 'hydration_factor' => 0.50, 'color' => '#dc2626', 'icon' => 'Wine', 'category' => 'wine'],
            ['name' => 'Batido', 'hydration_factor' => 0.80, 'color' => '#ec4899', 'icon' => 'Cup', 'category' => 'smoothie'],
        ];

        foreach ($drinkTypes as $type) {
            $user->drinkTypes()->create($type);
        }

        $moodStates = [
            ['emoji' => '😍', 'text' => 'Enamorado', 'value' => 10, 'category' => 'Emocional'],
            ['emoji' => '😊', 'text' => 'Feliz', 'value' => 10, 'category' => 'Emocional'],
            ['emoji' => '🌟', 'text' => 'Energético', 'value' => 10, 'category' => 'Físico'],
            ['emoji' => '🧠', 'text' => 'Productivo', 'value' => 10, 'category' => 'Mental'],
            ['emoji' => '😎', 'text' => 'Confiado', 'value' => 9, 'category' => 'Mental'],
            ['emoji' => '😌', 'text' => 'Tranquilo', 'value' => 8, 'category' => 'Emocional'],
            ['emoji' => '🤔', 'text' => 'Pensativo', 'value' => 6, 'category' => 'Mental'],
            ['emoji' => '🥱', 'text' => 'Aburrido', 'value' => 5, 'category' => 'Emocional'],
            ['emoji' => '😴', 'text' => 'Pereza', 'value' => 4, 'category' => 'Físico'],
            ['emoji' => '😕', 'text' => 'Confundido', 'value' => 5, 'category' => 'Mental'],
            ['emoji' => '😬', 'text' => 'Nervioso', 'value' => 3, 'category' => 'Emocional'],
            ['emoji' => '🤯', 'text' => 'Abrumado', 'value' => 3, 'category' => 'Mental'],
            ['emoji' => '😤', 'text' => 'Frustración', 'value' => 3, 'category' => 'Emocional'],
            ['emoji' => '😰', 'text' => 'Ansioso', 'value' => 2, 'category' => 'Emocional'],
            ['emoji' => '😪', 'text' => 'Cansado', 'value' => 2, 'category' => 'Físico'],
            ['emoji' => '😢', 'text' => 'Triste', 'value' => 1, 'category' => 'Emocional'],
            ['emoji' => '😡', 'text' => 'Enojado', 'value' => 1, 'category' => 'Emocional'],
            ['emoji' => '🤒', 'text' => 'Enfermo', 'value' => 1, 'category' => 'Físico'],
        ];

        foreach ($moodStates as $state) {
            $user->moodStates()->create($state);
        }
    }
}
