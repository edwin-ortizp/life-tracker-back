<?php

namespace Tests\Feature;

use App\Livewire\Journal\JournalEntries;
use App\Livewire\Journal\JournalSummary;
use App\Models\JournalEntry;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class JournalSummaryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-09-13 10:00:00');
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function entry(string $date, ?string $summary, ?User $user = null): JournalEntry
    {
        $entry = new JournalEntry(['date' => $date, 'text' => 'Texto completo '.$date, 'summary' => $summary]);
        $entry->user_id = ($user ?? $this->user)->id;
        $entry->save();

        return $entry;
    }

    public function test_entries_screen_saves_and_loads_summary_without_replacing_text(): void
    {
        Livewire::test(JournalEntries::class)
            ->set('text', 'Un día largo con muchos detalles.')
            ->set('summary', '  Terminé la propuesta  ')
            ->call('save');

        $entry = JournalEntry::first();
        $this->assertSame('Un día largo con muchos detalles.', $entry->text);
        $this->assertSame('Terminé la propuesta', $entry->summary);

        Livewire::test(JournalEntries::class)
            ->assertSet('summary', 'Terminé la propuesta')
            ->set('summary', '')
            ->call('save');

        $this->assertNull($entry->fresh()->summary);
        $this->assertSame('Un día largo con muchos detalles.', $entry->fresh()->text);
    }

    public function test_summary_is_limited_to_255_characters(): void
    {
        Livewire::test(JournalEntries::class)
            ->set('text', 'Texto')
            ->set('summary', str_repeat('a', 256))
            ->call('save')
            ->assertHasErrors(['summary' => 'max']);
    }

    public function test_lists_only_summarised_entries_newest_first_for_last_month_by_default(): void
    {
        $this->entry('2026-09-10', 'Resumen reciente');
        $this->entry('2026-09-01', 'Resumen anterior');
        $this->entry('2026-09-05', null);
        $this->entry('2026-09-06', '');
        $this->entry('2026-05-01', 'Resumen viejo');
        $this->entry('2026-09-11', 'Resumen ajeno', User::factory()->create());

        Livewire::test(JournalSummary::class)
            ->assertViewHas('entries', fn ($entries) => $entries->pluck('summary')->all() === ['Resumen reciente', 'Resumen anterior'])
            ->assertDontSee('Resumen viejo')
            ->assertDontSee('Resumen ajeno')
            ->assertDontSee('Texto completo');
    }

    public function test_period_filters_and_custom_range(): void
    {
        $this->entry('2026-09-10', 'Septiembre');
        $this->entry('2026-05-01', 'Mayo');
        $this->entry('2025-12-01', 'Diciembre');
        $this->entry('2024-01-01', 'Muy viejo');

        $summaries = fn ($component) => $component->viewData('entries')->pluck('summary')->all();

        $this->assertSame(['Septiembre', 'Mayo'], $summaries(Livewire::test(JournalSummary::class)->set('period', '6m')));
        $this->assertSame(['Septiembre', 'Mayo', 'Diciembre'], $summaries(Livewire::test(JournalSummary::class)->set('period', '1y')));
        $this->assertSame(['Septiembre', 'Mayo', 'Diciembre', 'Muy viejo'], $summaries(Livewire::test(JournalSummary::class)->set('period', 'all')));

        $custom = Livewire::test(JournalSummary::class)->call('applyFilters', 'custom', '2026-06-01', '2025-11-01');
        $custom->assertSet('from', '2025-11-01')->assertSet('to', '2026-06-01');
        $this->assertSame(['Mayo', 'Diciembre'], $summaries($custom));

        Livewire::test(JournalSummary::class)->set('period', 'bogus')->assertSet('period', '1m');
    }

    public function test_summary_is_paginated(): void
    {
        foreach (range(1, 12) as $day) {
            $this->entry(sprintf('2026-09-%02d', $day), 'Día '.$day);
        }

        $component = Livewire::test(JournalSummary::class)->set('perPage', 10);
        $this->assertSame(12, $component->viewData('entries')->total());
        $this->assertCount(10, $component->viewData('entries')->items());
    }

    public function test_summary_route_renders_inside_journal_shell(): void
    {
        $this->entry('2026-09-10', 'Resumen visible');

        $this->get(route('journal.summary'))
            ->assertOk()
            ->assertSee('Resumen visible')
            ->assertSee(route('journal', ['date' => '2026-09-10']), false);
    }
}
