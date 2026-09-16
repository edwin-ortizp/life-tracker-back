<?php

namespace Tests\Feature\Habit;

use App\Livewire\Habit\HabitSettings;
use App\Models\DrinkType;
use App\Models\ExerciseType;
use App\Models\HabitAction;
use App\Models\HabitDefinition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class HabitSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->actingAs(User::factory()->create());
    }

    public function test_the_settings_tab_renders_inside_the_module_shell(): void
    {
        HabitDefinition::create(['name' => 'Estirar', 'time_of_day' => 'morning']);

        $this->get(route('habits.settings'))
            ->assertOk()
            ->assertSee('Tus hábitos')
            ->assertSee('Estirar');
    }

    public function test_creating_a_habit_with_an_automatic_action_stores_the_link(): void
    {
        $water = DrinkType::create(['name' => 'Agua', 'hydration_factor' => 1]);

        Livewire::test(HabitSettings::class)
            ->call('openForm')
            ->set('name', 'Vaso de agua')
            ->set('timeOfDay', 'morning')
            ->set('actionKey', 'water.log_intake')
            ->set('actionMode', HabitAction::MODE_AUTO)
            ->set('actionConfig.drink_type_id', $water->id)
            ->set('actionConfig.amount_ml', 250)
            ->call('save')
            ->assertHasNoErrors()
            ->assertSet('showForm', false);

        $habit = HabitDefinition::where('name', 'Vaso de agua')->sole();
        $this->assertSame('water.log_intake', $habit->action->action_key);
        $this->assertSame(HabitAction::MODE_AUTO, $habit->action->mode);
        $this->assertSame(250, (int) $habit->action->config['amount_ml']);
    }

    public function test_an_existing_habit_can_gain_and_lose_its_action(): void
    {
        ExerciseType::create(['name' => 'Correr', 'calories_per_hour' => 600, 'steps_equivalent' => 0]);
        $habit = HabitDefinition::create(['name' => 'Ejercicio', 'time_of_day' => 'morning']);

        $component = Livewire::test(HabitSettings::class)
            ->call('openForm', $habit->id)
            ->assertSet('actionKey', '')
            ->set('actionKey', 'exercise.log')
            ->set('actionMode', HabitAction::MODE_PROMPT)
            ->call('save')
            ->assertHasNoErrors();

        $this->assertSame('exercise.log', $habit->fresh()->action->action_key);
        $this->assertSame(HabitAction::MODE_PROMPT, $habit->fresh()->action->mode);

        // Y se le puede quitar volviendo a «Nada, solo marcarlo».
        $component->call('openForm', $habit->id)
            ->assertSet('actionKey', 'exercise.log')
            ->set('actionKey', '')
            ->call('save')
            ->assertHasNoErrors();

        $this->assertNull($habit->fresh()->action);
    }

    public function test_changing_the_module_resets_the_previous_configuration(): void
    {
        DrinkType::create(['name' => 'Agua', 'hydration_factor' => 1]);
        ExerciseType::create(['name' => 'Correr', 'calories_per_hour' => 600, 'steps_equivalent' => 0]);

        Livewire::test(HabitSettings::class)
            ->call('openForm')
            ->set('actionKey', 'water.log_intake')
            ->assertSet('actionConfig.amount_ml', 250)
            ->set('actionKey', 'exercise.log')
            // La configuración de agua ya no aplica; entran los valores del nuevo módulo.
            ->assertSet('actionConfig.duration', 30)
            ->assertSet('actionConfig.amount_ml', null);
    }

    public function test_an_automatic_action_requires_its_configuration(): void
    {
        DrinkType::create(['name' => 'Agua', 'hydration_factor' => 1]);

        Livewire::test(HabitSettings::class)
            ->call('openForm')
            ->set('name', 'Vaso de agua')
            ->set('actionKey', 'water.log_intake')
            ->set('actionMode', HabitAction::MODE_AUTO)
            ->set('actionConfig.amount_ml', null)
            ->call('save')
            ->assertHasErrors('actionConfig.amount_ml');
    }

    public function test_a_user_cannot_see_or_edit_another_users_habits(): void
    {
        $other = User::factory()->create();
        // Vía la relación: user_id no es fillable, así que asignarlo a mano no basta.
        $foreign = $other->habitDefinitions()->create([
            'name' => 'Hábito ajeno',
            'time_of_day' => 'morning',
        ]);

        Livewire::test(HabitSettings::class)
            ->assertDontSee('Hábito ajeno')
            ->call('openForm', $foreign->id)
            ->assertSet('editingId', null)
            ->call('delete', $foreign->id);

        $this->assertNotNull(HabitDefinition::withoutGlobalScope('user')->find($foreign->id));
    }
}
