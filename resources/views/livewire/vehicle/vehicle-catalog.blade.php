@php
    use App\Support\Ui\DataState;

    $catalogFilters = array_filter([
        $catalogSearch, $catalogCategory, $catalogSource,
        $catalogVehicleType, $catalogPowerSource, $catalogTransmissionType,
    ], static fn ($value) => $value !== '');

    $catalogState = DataState::resolve(
        visible: $catalogTemplates->count(),
        total: $catalogFilters === [] ? $catalogTemplates->total() : 1,
    );
@endphp

<x-module-shell module="vehicles" title="Catálogo de mantenimientos" subtitle="Plantillas base y personales para tu garaje." icon="bi-tools" archetype="list">
    <x-slot:actions><x-module-actions mobile-style="inline" :primary="['label' => 'Nueva plantilla', 'icon' => 'bi-plus-lg', 'action' => 'openTemplateForm']" :secondary="[['label' => 'Volver al garaje', 'icon' => 'bi-arrow-left', 'href' => route('vehicles')]]" /></x-slot:actions>

    <x-slot:controls>
        <x-ui.filter-bar search="catalogSearch" placeholder="Buscar nombre o descripción" label="Filtros del catálogo">
            <x-slot:chips>
                <x-ui.filter-menu name="catalogCategory" label="Categorías" allLabel="Todas las categorías"
                                  :options="collect($catalogCategories)->mapWithKeys(fn ($category) => [$category => $category])->all()"
                                  :selected="$catalogCategory" />

                <x-ui.filter-menu name="catalogSource" label="Origen" allLabel="Base y personal"
                                  :options="['base' => 'Solo base', 'personal' => 'Solo personal']"
                                  :selected="$catalogSource" />

                <x-ui.filter-menu name="catalogVehicleType" label="Vehículo" allLabel="Todos los vehículos"
                                  :options="['automovil' => 'Automóvil', 'motocicleta' => 'Motocicleta', 'bicicleta' => 'Bicicleta', 'patineta' => 'Patineta', 'otro' => 'Otro']"
                                  :selected="$catalogVehicleType" />

                <x-ui.filter-menu name="catalogPowerSource" label="Propulsión" allLabel="Toda propulsión"
                                  :options="['gasolina' => 'Gasolina', 'diesel' => 'Diésel', 'electrico' => 'Eléctrica', 'hibrido' => 'Híbrida', 'humana' => 'Humana', 'ninguna' => 'Ninguna']"
                                  :selected="$catalogPowerSource" />

                <x-ui.filter-menu name="catalogTransmissionType" label="Transmisión" allLabel="Todas las transmisiones"
                                  :options="['manual' => 'Manual', 'automatica' => 'Automática', 'cvt' => 'CVT', 'automatizada' => 'Automatizada', 'no_aplica' => 'No aplica']"
                                  :selected="$catalogTransmissionType" />

                @if ($catalogFilters !== [])
                    <div class="md-chip-rail__divider"></div>
                    <x-ui.action variant="text" size="sm" icon="bi-x-circle" wire:click="clearCatalogFilters">Limpiar</x-ui.action>
                @endif
            </x-slot:chips>
        </x-ui.filter-bar>
    </x-slot:controls>

    @if ($catalogMessage)
        <x-ui.snackbar>{{ $catalogMessage }}</x-ui.snackbar>
    @endif

    <x-ui.section title="Plantillas" :description="$catalogTemplates->total().' resultados'">
        @if ($catalogState === DataState::CONTENT)
            <div class="vehicle-catalog-grid">
                @foreach ($catalogTemplates as $template)
                    <article class="md-card-outlined" wire:key="template-{{ $template->id }}">
                        <header>
                            <div>
                                <span>{{ $template->category }}</span>
                                <h3>{{ $template->name }}</h3>
                            </div>
                            <small>{{ $template->user_id ? 'Personal' : 'Base' }}</small>
                        </header>
                        <p>{{ $template->description ?: 'Sin descripción.' }}</p>
                        <div class="vehicle-catalog-card__footer">
                            <span>{{ $template->default_interval_days ? 'Cada '.$template->default_interval_days.' días' : 'Sin periodo' }}{{ $template->default_interval_days && $template->default_interval_usage ? ' · ' : '' }}{{ $template->default_interval_usage ? number_format($template->default_interval_usage, 0, ',', '.').' de uso' : '' }}</span>
                            @if ($template->user_id)
                                <div>
                                    <x-ui.icon-action icon="bi-pencil" label="Editar la plantilla {{ $template->name }}" size="sm"
                                                      wire:click="openTemplateForm('{{ $template->id }}')" />
                                    <x-ui.destructive-action label="Eliminar la plantilla {{ $template->name }}" :iconOnly="true" size="sm"
                                                             action="deleteTemplate('{{ $template->id }}')"
                                                             title="Eliminar plantilla"
                                                             message="La plantilla «{{ $template->name }}» se elimina de forma permanente." />
                                </div>
                            @endif
                        </div>
                    </article>
                @endforeach
            </div>

            <div class="vehicle-pagination">{{ $catalogTemplates->links() }}</div>
        @elseif ($catalogState === DataState::FILTERED_EMPTY)
            <x-ui.state variant="filtered-empty" icon="bi-tools" message="Hay plantillas en el catálogo, pero ninguna coincide con los filtros activos.">
                <x-slot:actions>
                    <x-ui.action variant="outlined" icon="bi-x-circle" wire:click="clearCatalogFilters">Limpiar filtros</x-ui.action>
                </x-slot:actions>
            </x-ui.state>
        @else
            <x-ui.state variant="empty" icon="bi-tools" title="No hay plantillas disponibles"
                        message="Crea una plantilla para reutilizarla en los cuidados de tu garaje.">
                <x-slot:actions>
                    <x-ui.action variant="filled" icon="bi-plus-lg" wire:click="openTemplateForm">Nueva plantilla</x-ui.action>
                </x-slot:actions>
            </x-ui.state>
        @endif
    </x-ui.section>

    @include('livewire.vehicle.partials.template-form')
</x-module-shell>
