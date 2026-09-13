<?php

namespace Tests\Feature\Ui;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Blade;
use Tests\TestCase;

class ManagementCardTest extends TestCase
{
    private function paginator(int $total = 58, int $perPage = 25, int $page = 1): LengthAwarePaginator
    {
        $items = max(0, min($perPage, $total - ($page - 1) * $perPage));

        return new LengthAwarePaginator(array_fill(0, $items, 1), $total, $perPage, $page, ['path' => '/']);
    }

    public function test_it_renders_header_tools_body_and_footer(): void
    {
        $html = Blade::render(<<<'BLADE'
            <x-ui.management-card id="demo" title="Cronología de salud" icon="bi-clock-history" count="(25 / 58)"
                search="search" search-placeholder="Buscar eventos" :active-filters="2" :paginator="$paginator" noun="eventos">
                <x-slot:filters>Campos</x-slot:filters>
                <x-slot:menu><x-ui.menu-item icon="bi-filetype-csv">Exportar CSV</x-ui.menu-item></x-slot:menu>
                Contenido
            </x-ui.management-card>
            BLADE, ['paginator' => $this->paginator()]);

        $this->assertStringContainsString('md-mcard__head', $html);
        $this->assertStringContainsString('Cronología de salud', $html);
        $this->assertMatchesRegularExpression('/<h2 class="md-mcard__heading"[^>]*>\s*<span class="md-mcard__heading-text">Cronología de salud<\/span>\s*<span class="md-mcard__count"[^>]*><span aria-hidden="true">·<\/span> \(25 \/ 58\)<\/span>\s*<\/h2>/u', $html);
        $this->assertStringContainsString('wire:model.live.debounce.300ms="search"', $html);
        $this->assertStringContainsString('id="demo-filters"', $html);
        $this->assertStringContainsString('2 filtros activos', $html);
        $this->assertStringContainsString('Exportar CSV', $html);
        $this->assertStringContainsString('Contenido', $html);
        $this->assertStringContainsString('md-mcard__foot', $html);
        $this->assertMatchesRegularExpression('/Mostrando <strong>1–25<\/strong> de <strong>58<\/strong> eventos/u', $html);
        $this->assertStringContainsString('wire:model.live="perPage"', $html);
        $this->assertMatchesRegularExpression('/md-pager__page is-active" aria-current="page"/', $html);
        $this->assertMatchesRegularExpression('/wire:click="previousPage\(\'page\'\)"[^>]*disabled/', $html);
        $this->assertStringContainsString('1 / 3', $html);
    }

    public function test_it_omits_tools_and_footer_when_not_configured(): void
    {
        $html = Blade::render('<x-ui.management-card title="Registro de hoy" icon="bi-droplet">Lista</x-ui.management-card>');

        $this->assertStringNotContainsString('md-mcard__tools', $html);
        $this->assertStringNotContainsString('md-mcard__foot', $html);
        $this->assertStringContainsString('Lista', $html);
    }

    public function test_the_last_page_disables_next(): void
    {
        $html = Blade::render('<x-ui.management-card title="Planes" icon="bi-map" :paginator="$p">x</x-ui.management-card>', ['p' => $this->paginator(58, 25, 3)]);

        $this->assertMatchesRegularExpression('/wire:click="nextPage\(\'page\'\)"[^>]*disabled/', $html);
        $this->assertStringContainsString('Mostrando <strong>51–58</strong>', $html);
    }

    public function test_split_fab_renders_primary_and_toggle(): void
    {
        $html = Blade::render(<<<'BLADE'
            <x-ui.fab label="Registrar evento" event="health-editor" :detail="['action' => 'openForm']" :split="true"
                :actions="[['label' => 'Nuevo pendiente', 'icon' => 'bi-list-check', 'action' => 'createPending']]" />
            BLADE);

        $this->assertStringContainsString('md-fab-split__main', $html);
        $this->assertStringContainsString('md-fab-split__toggle', $html);
        $this->assertStringContainsString('Nuevo pendiente', $html);
        $this->assertStringContainsString('md-fab-split__compact', $html);
        $this->assertStringContainsString('md-create-fab__item--primary', $html);
    }
}
