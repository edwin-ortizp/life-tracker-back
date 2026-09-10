<?php

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\LifeTrackerServer;
use App\Mcp\Tools\Mood\LogEnergyEntryTool;
use App\Mcp\Tools\Mood\LogMoodEntryTool;
use App\Models\EnergyEntry;
use App\Models\MoodEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LifeTrackerMoodMcpTest extends TestCase
{
    use RefreshDatabase;

    public function test_log_mood_entry_tool_records_a_mood_by_text(): void
    {
        $user = User::factory()->create();
        $user->moodStates()->create(['emoji' => '🙂', 'text' => 'Feliz', 'value' => 4]);

        LifeTrackerServer::actingAs($user)
            ->tool(LogMoodEntryTool::class, ['mood' => 'Feliz', 'intensity' => 3])
            ->assertOk()
            ->assertSee('Feliz');

        $entry = MoodEntry::where('user_id', $user->id)->firstOrFail();
        $this->assertSame('Feliz', $entry->text);
        $this->assertSame(3, $entry->intensity);
    }

    public function test_log_mood_entry_tool_errors_when_nothing_matches(): void
    {
        $user = User::factory()->create();

        LifeTrackerServer::actingAs($user)
            ->tool(LogMoodEntryTool::class, ['mood' => 'Inexistente'])
            ->assertHasErrors();

        $this->assertSame(0, MoodEntry::where('user_id', $user->id)->count());
    }

    public function test_log_energy_entry_tool_records_a_level(): void
    {
        $user = User::factory()->create();

        LifeTrackerServer::actingAs($user)
            ->tool(LogEnergyEntryTool::class, ['level' => 4, 'comment' => 'Buen día'])
            ->assertOk()
            ->assertSee('4/5');

        $entry = EnergyEntry::where('user_id', $user->id)->firstOrFail();
        $this->assertSame(4, $entry->level);
        $this->assertSame('Buen día', $entry->comment);
    }
}
