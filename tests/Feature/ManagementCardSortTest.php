<?php

namespace Tests\Feature;

use App\Livewire\Goal\GoalIndex;
use App\Livewire\Mood\MoodTracker;
use App\Livewire\Relationship\RelationshipIndex;
use App\Livewire\Task\TaskList;
use App\Livewire\Vehicle\VehicleExpenses;
use App\Models\EnergyEntry;
use App\Models\Goal;
use App\Models\Relationship;
use App\Models\Task;
use App\Models\User;
use App\Models\VehicleExpenseCategory;
use App\Support\DefaultVehicleExpenseCategories;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class ManagementCardSortTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    private function order(string $key, array $expected): \Closure
    {
        return fn ($rows) => collect($rows->items())->pluck($key)->all() === $expected;
    }

    public function test_tasks_sort_by_title_and_reject_unknown_keys(): void
    {
        foreach (['Beta', 'Alfa', 'Gamma'] as $title) {
            Task::create(['title' => $title]);
        }

        Livewire::test(TaskList::class)
            ->assertSee('Cronológico')
            ->set('sort', 'title')
            ->assertViewHas('tasks', $this->order('title', ['Alfa', 'Beta', 'Gamma']))
            ->set('sort', 'nope')
            ->assertSet('sort', 'chronological');
    }

    public function test_goals_sort_by_due_date_with_undated_last(): void
    {
        Goal::create(['title' => 'Sin fecha', 'status' => 'active']);
        Goal::create(['title' => 'Lejana', 'status' => 'active', 'due_date' => now()->addMonth()]);
        Goal::create(['title' => 'Cercana', 'status' => 'active', 'due_date' => now()->addDay()]);

        Livewire::test(GoalIndex::class)
            ->set('sort', 'due')
            ->assertViewHas('goals', $this->order('title', ['Cercana', 'Lejana', 'Sin fecha']))
            ->set('sort', 'title')
            ->assertViewHas('goals', $this->order('title', ['Cercana', 'Lejana', 'Sin fecha']));
    }

    public function test_relationships_sort_by_last_contact(): void
    {
        Relationship::factory()->create(['user_id' => $this->user->id, 'full_name' => 'Ana', 'last_contact_at' => now()->subDays(10)]);
        Relationship::factory()->create(['user_id' => $this->user->id, 'full_name' => 'Beto', 'last_contact_at' => now()->subDay()]);
        Relationship::factory()->create(['user_id' => $this->user->id, 'full_name' => 'Carla', 'last_contact_at' => null]);

        Livewire::test(RelationshipIndex::class)
            ->assertViewHas('relationships', $this->order('full_name', ['Ana', 'Beto', 'Carla']))
            ->set('sort', 'last')
            ->assertViewHas('relationships', $this->order('full_name', ['Beto', 'Ana', 'Carla']));
    }

    public function test_energy_entries_sort_by_level_and_oldest(): void
    {
        $date = now()->toDateString();
        foreach ([[2, '08:00'], [5, '12:00'], [3, '18:00']] as [$level, $time]) {
            EnergyEntry::create(['date' => $date, 'level' => $level, 'time' => $time, 'timestamp' => strtotime("$date $time")]);
        }

        Livewire::test(MoodTracker::class)
            ->assertViewHas('energyEntries', $this->order('level', [3, 5, 2]))
            ->set('energySort', 'oldest')
            ->assertViewHas('energyEntries', $this->order('level', [2, 5, 3]))
            ->set('energySort', 'level')
            ->assertViewHas('energyEntries', $this->order('level', [5, 3, 2]));
    }

    public function test_vehicle_expenses_sort_by_amount(): void
    {
        DefaultVehicleExpenseCategories::createFor($this->user);
        $vehicle = $this->user->vehicles()->create(['name' => 'Cruze', 'vehicle_type' => 'automovil', 'power_source' => 'gasolina', 'usage_unit' => 'km']);
        $category = VehicleExpenseCategory::firstOrFail();
        foreach ([[100, 3], [900, 2], [500, 1]] as [$amount, $daysAgo]) {
            $vehicle->expenses()->create(['vehicle_expense_category_id' => $category->id, 'amount' => $amount, 'spent_on' => now()->subDays($daysAgo)]);
        }

        $amounts = fn (array $expected) => fn ($rows) => collect($rows->items())->map(fn ($e) => (int) $e->amount)->all() === $expected;

        Livewire::test(VehicleExpenses::class, ['vehicle' => $vehicle->id])
            ->assertViewHas('expenses', $amounts([500, 900, 100]))
            ->set('expenseSort', 'amount')
            ->assertViewHas('expenses', $amounts([900, 500, 100]));
    }
}
