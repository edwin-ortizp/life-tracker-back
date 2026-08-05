<?php

namespace Tests\Feature\Ui;

use Illuminate\Support\Facades\Blade;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class UiPrimitivesTest extends TestCase
{
    private function render(string $template, array $data = []): string
    {
        return Blade::render($template, $data);
    }

    public function test_action_renders_variants_sizes_and_tones(): void
    {
        $html = $this->render('<x-ui.action variant="tonal" tone="danger" size="sm" icon="bi-trash">Eliminar</x-ui.action>');

        $this->assertStringContainsString('md-btn-tonal', $html);
        $this->assertStringContainsString('md-btn--danger', $html);
        $this->assertStringContainsString('md-btn--sm', $html);
        $this->assertStringContainsString('bi-trash', $html);
        $this->assertStringContainsString('Eliminar', $html);
    }

    public function test_action_propagates_livewire_alpine_and_data_attributes(): void
    {
        $html = $this->render('<x-ui.action wire:click="save" x-on:click="open = false" data-testid="save" aria-controls="panel">Guardar</x-ui.action>');

        $this->assertStringContainsString('wire:click="save"', $html);
        $this->assertStringContainsString('x-on:click="open = false"', $html);
        $this->assertStringContainsString('data-testid="save"', $html);
        $this->assertStringContainsString('aria-controls="panel"', $html);
    }

    public function test_action_communicates_loading_and_disabled_without_duplicating_activations(): void
    {
        $loading = $this->render('<x-ui.action :loading="true">Guardar</x-ui.action>');

        $this->assertStringContainsString('aria-busy="true"', $loading);
        $this->assertStringContainsString('disabled', $loading);
        $this->assertStringContainsString('md-btn__spinner', $loading);

        $disabled = $this->render('<x-ui.action :disabled="true">Guardar</x-ui.action>');

        $this->assertStringContainsString('disabled', $disabled);
        $this->assertStringNotContainsString('aria-busy', $disabled);
    }

    public function test_action_renders_a_link_when_it_navigates(): void
    {
        $html = $this->render('<x-ui.action href="/tasks" variant="text">Ver tareas</x-ui.action>');

        $this->assertStringContainsString('<a href="/tasks"', $html);
        $this->assertStringContainsString('md-btn-text', $html);
    }

    public function test_action_rejects_presentation_properties(): void
    {
        $this->expectException(HttpException::class);

        $this->render('<x-ui.action variant="rounded-red">Guardar</x-ui.action>');
    }

    public function test_icon_action_requires_an_accessible_name(): void
    {
        $html = $this->render('<x-ui.icon-action icon="bi-pencil" label="Editar tarea" />');

        $this->assertStringContainsString('aria-label="Editar tarea"', $html);
        $this->assertStringContainsString('md-btn-icon', $html);

        $this->expectException(HttpException::class);
        $this->render('<x-ui.icon-action icon="bi-pencil" label="" />');
    }

    public function test_field_relates_label_help_and_error_to_the_control(): void
    {
        $html = $this->render('<x-ui.field name="title" label="Título" help="Máximo 80 caracteres" error="El título es obligatorio" wire:model="title" />');

        $this->assertStringContainsString('id="field-title"', $html);
        $this->assertStringContainsString('for="field-title"', $html);
        $this->assertStringContainsString('aria-invalid="true"', $html);
        $this->assertStringContainsString('aria-describedby="field-title-help field-title-error"', $html);
        $this->assertStringContainsString('role="alert"', $html);
        $this->assertStringContainsString('wire:model="title"', $html);
        $this->assertStringContainsString('md-error', $html);
    }

    public function test_field_marks_required_controls(): void
    {
        $html = $this->render('<x-ui.field name="title" label="Título" :required="true" />');

        $this->assertStringContainsString('required', $html);
        $this->assertStringNotContainsString('aria-invalid', $html);
    }

    public function test_select_renders_options_and_keeps_the_canonical_class(): void
    {
        $html = $this->render('<x-ui.select name="status" label="Estado" placeholder="Todos" :options="$options" selected="done" />', [
            'options' => ['todo' => 'Pendiente', 'done' => 'Hecha'],
        ]);

        $this->assertStringContainsString('md-select', $html);
        $this->assertStringContainsString('<option value="">Todos</option>', $html);
        $this->assertStringContainsString('selected', $html);
        $this->assertStringContainsString('Pendiente', $html);
    }

    public function test_textarea_keeps_its_value_and_accessible_relations(): void
    {
        $html = $this->render('<x-ui.textarea name="notes" label="Notas" value="Contenido" rows="5" help="Opcional" />');

        $this->assertStringContainsString('rows="5"', $html);
        $this->assertStringContainsString('>Contenido</textarea>', $html);
        $this->assertStringContainsString('aria-describedby="field-notes-help"', $html);
    }

    public function test_chip_exposes_selection_state(): void
    {
        $html = $this->render('<x-ui.chip variant="filter" :selected="true">Hoy</x-ui.chip>');

        $this->assertStringContainsString('md-chip-filter', $html);
        $this->assertStringContainsString('selected', $html);
        $this->assertStringContainsString('aria-pressed="true"', $html);
    }

    public function test_chip_badge_and_progress_share_the_semantic_tone_vocabulary(): void
    {
        $chip = $this->render('<x-ui.chip variant="tonal" tone="danger">Vencida</x-ui.chip>');
        $badge = $this->render('<x-ui.badge tone="danger">3</x-ui.badge>');
        $progress = $this->render('<x-ui.progress :value="30" tone="danger" label="Avance" />');

        $this->assertStringContainsString('md-chip-tonal--error', $chip);
        $this->assertStringContainsString('md-count-badge--error', $badge);
        $this->assertStringContainsString('md-progress-linear--error', $progress);
    }

    public function test_progress_reports_its_value_through_a_dynamic_custom_property(): void
    {
        $html = $this->render('<x-ui.progress :value="25" :max="50" label="Avance" valueText="25 de 50" />');

        $this->assertStringContainsString('--md-progress-value: 50%', $html);
        $this->assertStringContainsString('aria-valuenow="50"', $html);
        $this->assertStringContainsString('role="progressbar"', $html);
        $this->assertStringContainsString('25 de 50', $html);
    }

    public function test_progress_without_a_value_is_indeterminate(): void
    {
        $html = $this->render('<x-ui.progress label="Cargando" />');

        $this->assertStringContainsString('md-progress-linear--indeterminate', $html);
        $this->assertStringNotContainsString('aria-valuenow', $html);
    }

    public function test_card_renders_header_content_and_actions(): void
    {
        $html = $this->render(<<<'BLADE'
            <x-ui.card variant="filled" title="Resumen" icon="bi-stars">
                Contenido
                <x-slot:actions><x-ui.action variant="text">Ver</x-ui.action></x-slot:actions>
            </x-ui.card>
        BLADE);

        $this->assertStringContainsString('md-card-filled', $html);
        $this->assertStringContainsString('md-card-header', $html);
        $this->assertStringContainsString('Resumen', $html);
        $this->assertStringContainsString('md-card-actions', $html);
    }

    public function test_icon_is_hidden_from_assistive_technology_unless_it_carries_meaning(): void
    {
        $decorative = $this->render('<x-ui.icon name="bi-stars" />');
        $meaningful = $this->render('<x-ui.icon name="bi-exclamation-triangle" tone="warning" label="Atención" />');

        $this->assertStringContainsString('aria-hidden="true"', $decorative);
        $this->assertStringContainsString('role="img"', $meaningful);
        $this->assertStringContainsString('aria-label="Atención"', $meaningful);
        $this->assertStringContainsString('md-icon--warning', $meaningful);
    }

    public function test_a_material_destructive_action_asks_for_confirmation(): void
    {
        $html = $this->render('<x-ui.destructive-action label="Eliminar tarea" action="delete" />');

        $this->assertStringContainsString('md-btn--danger', $html);
        $this->assertStringContainsString('confirming = true', $html);
        $this->assertStringContainsString('role="dialog"', $html);
        $this->assertStringContainsString('aria-modal="true"', $html);
        $this->assertStringContainsString('x-md-surface', $html);
        $this->assertStringContainsString('wire:click="delete"', $html);
    }

    public function test_a_reversible_destructive_action_runs_without_confirmation(): void
    {
        $html = $this->render('<x-ui.destructive-action label="Quitar etiqueta" action="detach" risk="reversible" />');

        $this->assertStringContainsString('md-btn--danger', $html);
        $this->assertStringNotContainsString('role="dialog"', $html);
    }

    public function test_a_destructive_action_must_declare_what_it_triggers(): void
    {
        $this->expectException(HttpException::class);

        $this->render('<x-ui.destructive-action label="Eliminar" />');
    }
}
