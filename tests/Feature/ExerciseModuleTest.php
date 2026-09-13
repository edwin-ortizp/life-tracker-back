<?php

namespace Tests\Feature;

use App\Livewire\Exercise\ExerciseSettings;
use App\Livewire\Exercise\ExerciseStatistics;
use App\Models\ExerciseLog;
use App\Models\ExerciseType;
use App\Models\User;
use App\Support\DefaultExerciseTypes;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class ExerciseModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_three_exercise_tabs_render_inside_the_module_shell(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $type = ExerciseType::create(['name' => 'Correr', 'calories_per_hour' => 700, 'icon' => '🏃']);
        ExerciseLog::create(['date' => now()->toDateString(), 'exercise_type_id' => $type->id, 'duration' => 30, 'weight' => 10]);

        foreach (['/exercise', '/exercise/statistics', '/exercise/settings'] as $url) {
            $this->get($url)->assertOk()
                ->assertSee('md-module-shell', false)
                ->assertSee('Estadísticas')
                ->assertSee('Ajustes');
        }
    }

    public function test_default_catalog_skips_types_the_account_already_has_under_an_alias(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        ExerciseType::create(['name' => 'Caminata', 'calories_per_hour' => 250]);

        $created = DefaultExerciseTypes::createFor($user);

        $this->assertSame(count(DefaultExerciseTypes::all()) - 1, $created);
        $this->assertFalse(ExerciseType::where('name', 'Caminar')->exists());
        $this->assertSame(0, DefaultExerciseTypes::createFor($user));
    }

    public function test_settings_creates_and_validates_unique_names_per_user(): void
    {
        $this->actingAs(User::factory()->create());

        Livewire::test(ExerciseSettings::class)
            ->call('openForm')
            ->set('name', 'Remo')
            ->set('icon', '🚣')
            ->set('formCategory', 'cardio')
            ->set('caloriesPerHour', 500)
            ->call('save')
            ->assertHasNoErrors()
            ->call('openForm')
            ->set('name', 'Remo')
            ->set('caloriesPerHour', 400)
            ->call('save')
            ->assertHasErrors(['name' => 'unique']);

        $this->assertSame(1, ExerciseType::where('name', 'Remo')->count());
    }

    public function test_deleting_a_used_type_reassigns_its_logs_first(): void
    {
        $this->actingAs(User::factory()->create());
        $trotar = ExerciseType::create(['name' => 'Trotar', 'calories_per_hour' => 500]);
        $correr = ExerciseType::create(['name' => 'Correr', 'calories_per_hour' => 700]);
        ExerciseLog::create(['date' => now()->toDateString(), 'exercise_type_id' => $trotar->id, 'duration' => 30]);

        Livewire::test(ExerciseSettings::class)
            ->call('delete', $trotar->id)
            ->assertSet('deletingId', $trotar->id)
            ->call('reassignAndDelete')
            ->assertHasErrors(['reassignTo' => 'required'])
            ->set('reassignTo', $correr->id)
            ->call('reassignAndDelete')
            ->assertHasNoErrors();

        $this->assertModelMissing($trotar);
        $this->assertSame(1, ExerciseLog::where('exercise_type_id', $correr->id)->count());
    }

    public function test_statistics_summarize_the_selected_period(): void
    {
        $this->actingAs(User::factory()->create());
        $type = ExerciseType::create(['name' => 'Correr', 'calories_per_hour' => 700, 'icon' => '🏃']);
        ExerciseLog::create(['date' => now()->toDateString(), 'exercise_type_id' => $type->id, 'duration' => 30, 'calories' => 350]);
        ExerciseLog::create(['date' => now()->subDay()->toDateString(), 'exercise_type_id' => $type->id, 'duration' => 20, 'distance' => 5]);
        ExerciseLog::create(['date' => now()->subDays(40)->toDateString(), 'exercise_type_id' => $type->id, 'duration' => 60]);

        Livewire::withQueryParams(['periodo' => 7])
            ->test(ExerciseStatistics::class)
            ->assertViewHas('sessions', 2)
            ->assertViewHas('totalMinutes', 50)
            ->assertViewHas('streak', 2)
            ->assertSee('Correr');

        Livewire::withQueryParams(['periodo' => 90])
            ->test(ExerciseStatistics::class)
            ->assertViewHas('sessions', 3);
    }
}
