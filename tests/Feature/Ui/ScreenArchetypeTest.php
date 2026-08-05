<?php

namespace Tests\Feature\Ui;

use App\Support\Ui\ScreenArchetype;
use Illuminate\Support\Facades\Blade;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class ScreenArchetypeTest extends TestCase
{
    private function shell(string $archetype, string $extra = ''): string
    {
        return Blade::render(<<<BLADE
            <x-module-shell module="tasks" title="Tareas" archetype="{$archetype}">
                <x-slot:actions><x-ui.action icon="bi-plus-lg">Nueva tarea</x-ui.action></x-slot:actions>
                <x-slot:controls><x-ui.filter-bar search="search" placeholder="Buscar" /></x-slot:controls>
                <x-slot:rail><x-context-widget title="Resumen">Contenido</x-context-widget></x-slot:rail>
                {$extra}
                Contenido principal
            </x-module-shell>
        BLADE);
    }

    public function test_every_approved_archetype_composes_the_shared_shell(): void
    {
        foreach (ScreenArchetype::ALL as $archetype) {
            $html = $this->shell($archetype);

            $this->assertStringContainsString('md-module-shell', $html);
            $this->assertStringContainsString('data-archetype="'.$archetype.'"', $html);
            $this->assertStringContainsString('md-archetype--'.$archetype, $html);
        }
    }

    public function test_an_archetype_outside_the_approved_list_is_rejected(): void
    {
        $this->expectException(HttpException::class);

        $this->shell('kanban-especial');
    }

    public function test_the_shell_declares_identity_navigation_actions_controls_content_and_context(): void
    {
        $html = $this->shell(ScreenArchetype::LIST);

        foreach (['identity', 'navigation', 'actions', 'controls', 'content', 'context'] as $region) {
            $this->assertStringContainsString('data-region="'.$region.'"', $html, "Falta la región {$region}.");
        }
    }

    public function test_context_follows_the_main_content_in_semantic_order(): void
    {
        $html = $this->shell(ScreenArchetype::LIST);

        $this->assertLessThan(
            strpos($html, 'data-region="context"'),
            strpos($html, 'data-region="content"'),
            'El contexto debe ir después del contenido principal.',
        );
    }

    public function test_regions_keep_a_consistent_order_across_archetypes(): void
    {
        foreach (ScreenArchetype::ALL as $archetype) {
            $html = $this->shell($archetype);

            $positions = array_map(
                fn (string $region) => strpos($html, 'data-region="'.$region.'"'),
                ['identity', 'actions', 'navigation', 'controls', 'content', 'context'],
            );

            $sorted = $positions;
            sort($sorted);

            $this->assertSame($sorted, $positions, "El arquetipo {$archetype} altera el orden de las regiones.");
        }
    }

    public function test_a_screen_renders_a_single_module_heading(): void
    {
        $html = $this->shell(ScreenArchetype::DASHBOARD);

        $this->assertSame(1, substr_count($html, '<h1'));
    }

    public function test_only_one_action_is_visually_dominant_per_context(): void
    {
        $html = Blade::render(<<<'BLADE'
            <x-module-shell module="tasks" title="Tareas" archetype="list">
                <x-slot:actions>
                    <x-ui.action variant="outlined">Importar</x-ui.action>
                    <x-ui.action variant="outlined">Exportar</x-ui.action>
                    <x-ui.action variant="filled" icon="bi-plus-lg">Nueva tarea</x-ui.action>
                </x-slot:actions>
                Contenido
            </x-module-shell>
        BLADE);

        $actions = substr($html, (int) strpos($html, 'data-region="actions"'));
        $actions = substr($actions, 0, (int) strpos($actions, '</header>'));

        $this->assertSame(1, substr_count($actions, 'md-btn-filled'), 'Solo una acción puede recibir énfasis dominante.');
        $this->assertSame(2, substr_count($actions, 'md-btn-outlined'));
    }

    public function test_the_archetype_can_be_declared_by_the_module_configuration(): void
    {
        config()->set('modules.demo', ['title' => 'Demo', 'archetype' => ScreenArchetype::SETTINGS]);

        $html = Blade::render('<x-module-shell module="demo" title="Demo">Contenido</x-module-shell>');

        $this->assertStringContainsString('data-archetype="settings"', $html);
    }

    public function test_the_archetype_can_be_declared_by_the_active_tab(): void
    {
        $definition = [
            'tabs' => [
                ['label' => 'Listado', 'route' => 'demo.index', 'archetype' => ScreenArchetype::LIST],
                ['label' => 'Ajustes', 'route' => 'demo.settings', 'archetype' => ScreenArchetype::SETTINGS],
            ],
        ];

        $this->assertSame(ScreenArchetype::SETTINGS, ScreenArchetype::resolve(null, $definition, 'demo.settings'));
        $this->assertSame(ScreenArchetype::LIST, ScreenArchetype::resolve(null, $definition, 'demo.index'));
        $this->assertTrue(ScreenArchetype::isDeclared(null, $definition, 'demo.settings'));
        $this->assertFalse(ScreenArchetype::isDeclared(null, $definition, 'demo.unknown'));
    }

    public function test_a_guided_flow_reports_its_current_step(): void
    {
        $html = Blade::render('<x-ui.flow-steps :steps="$steps" :current="2" />', [
            'steps' => ['Contexto', 'Emoción', 'Cierre'],
        ]);

        $this->assertStringContainsString('aria-current="step"', $html);
        $this->assertSame(1, substr_count($html, 'aria-current="step"'));
        $this->assertStringContainsString('Emoción', $html);
    }

    public function test_tabs_and_context_parameters_are_untouched_by_the_archetype(): void
    {
        $before = config('modules.tasks');

        $html = $this->shell(ScreenArchetype::DETAIL);

        $this->assertSame($before, config('modules.tasks'));
        $this->assertStringContainsString('md-module-tabs', $html);
    }
}
