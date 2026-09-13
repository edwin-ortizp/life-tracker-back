<x-module-shell module="plans" class="plans-page">
    <x-slot:actions>
        <x-module-actions :primary="['label' => 'Agregar plan', 'icon' => 'bi-plus-lg', 'action' => 'openPlanForm']" :fab-always="true" />
    </x-slot:actions>

    <section class="plans-section" aria-labelledby="plans-title">
        <div class="plans-toolbar" x-data="{ filtersOpen: false }">
            <h2 id="plans-title" class="plans-toolbar__title">
                <i class="bi bi-map" aria-hidden="true"></i>
                <span>Tus planes</span>
                <span class="plans-count" title="Planes visibles del total">({{ $plans->count() }} de {{ $total }})</span>
            </h2>

            <div class="plans-toolbar__actions">
                <x-ui.action variant="tonal" icon="bi-shuffle" wire:click="surprise">Sorpréndeme</x-ui.action>
                <x-ui.action variant="outlined" icon="bi-sliders" class="plans-filter-button"
                             data-popover-trigger aria-haspopup="dialog" aria-controls="plans-filters"
                             x-on:click="filtersOpen = !filtersOpen" x-bind:aria-expanded="filtersOpen.toString()">
                    Filtros
                    @if (count($activeFilters) > 0)
                        <x-ui.badge placement="corner" :label="count($activeFilters).' '.(count($activeFilters) === 1 ? 'filtro activo' : 'filtros activos')">{{ count($activeFilters) }}</x-ui.badge>
                    @endif
                </x-ui.action>

                <x-ui.popover state="filtersOpen" title="Filtros" id="plans-filters">
                    <x-ui.select name="status" label="Estado" :options="$statusOptions" :selected="$status" placeholder="Todos menos archivados" icon="bi-flag" wire:model.live="status" />
                    <x-ui.select name="city" label="Ciudad" :options="$cityOptions" :selected="$city" placeholder="Todas las ciudades" icon="bi-geo-alt" wire:model.live="city" />
                    <x-ui.multi-select name="types" label="Tipo de plan" :options="$typeOptions" all-label="Todos los tipos" icon="bi-tag" />
                    <x-ui.multi-select name="circles" label="Círculo" :options="$circleOptions" all-label="Todos los círculos" icon="bi-diagram-3" />
                    <x-ui.multi-select name="people" label="Persona" :options="$peopleOptions" all-label="Todas las personas" icon="bi-people" />
                    <x-slot:actions>
                        <x-ui.action variant="text" wire:click="clearFilters">Limpiar</x-ui.action>
                        <x-ui.action variant="filled" x-on:click="filtersOpen = false">Aplicar</x-ui.action>
                    </x-slot:actions>
                </x-ui.popover>
            </div>
        </div>

        <div class="plans-groups" role="group" aria-label="Grupos de planes">
            <x-ui.chip variant="filter" icon="bi-grid" :selected="$group === ''" wire:click="setGroup('')">Todos ({{ $total }})</x-ui.chip>
            @foreach ($groups as $key => $item)
                <x-ui.chip variant="filter" :icon="$item['icon']" :selected="$group === $key" wire:click="setGroup('{{ $key }}')" wire:key="plans-group-{{ $key }}">{{ $item['label'] }} ({{ $item['count'] }})</x-ui.chip>
            @endforeach
        </div>

        <div class="plans-search">
            <x-ui.field name="q" type="search" label="Buscar planes" icon="bi-search" wire:model.live.debounce.300ms="q" />
            <x-ui.select name="sort" label="Ordenar por" :options="$sorts" :selected="$sort" icon="bi-sort-down" wire:model.live="sort" />
        </div>

        @if (count($activeFilters) > 0)
            <div class="plans-applied-filters" role="group" aria-label="Filtros aplicados">
                @foreach ($activeFilters as $filter)
                    <span class="md-chip md-chip-input plans-applied-chip" wire:key="plans-filter-{{ $filter['key'] }}-{{ $filter['value'] }}">
                        <i class="bi {{ $filter['icon'] }}" aria-hidden="true"></i>
                        <span>{{ $filter['label'] }}</span>
                        <button type="button" class="md-btn-icon md-btn--sm plans-applied-chip__remove"
                                wire:click="removeFilter(@js($filter['key']), @js($filter['value']))"
                                aria-label="Quitar filtro {{ $filter['label'] }}" title="Quitar filtro">
                            <i class="bi bi-x" aria-hidden="true"></i>
                        </button>
                    </span>
                @endforeach
                <button type="button" class="md-btn-text md-btn--sm plans-clear-filters" wire:click="clearFilters">Limpiar filtros</button>
            </div>
        @endif

        @if ($surpriseMessage)
            <p class="plans-notice" role="status"><i class="bi bi-info-circle" aria-hidden="true"></i> {{ $surpriseMessage }}</p>
        @endif

        @if ($dataState === \App\Support\Ui\DataState::CONTENT)
            <div class="plans-list">
                @foreach ($plans as $plan)
                    @include('livewire.plan.partials.plan-row', ['plan' => $plan, 'relationship' => null])
                @endforeach
            </div>
        @elseif ($dataState === \App\Support\Ui\DataState::FILTERED_EMPTY)
            <x-ui.state variant="filtered-empty" message="Prueba con otro grupo, otra búsqueda o limpia los filtros." />
        @else
            <x-ui.state variant="empty" icon="bi-map" title="Todavía no tienes planes" message="Guarda restaurantes, viajes o actividades que quieras hacer con tus personas." />
        @endif
    </section>

    <x-slot:rail>
        <section class="plan-card" aria-labelledby="plans-summary-title">
            <header class="plan-card__head">
                <i class="bi bi-bar-chart-line" aria-hidden="true"></i>
                <h2 id="plans-summary-title">Resumen de planes</h2>
            </header>
            <div class="plan-card__body">
                <dl class="plans-kpis">
                    <div><dt>Pendientes</dt><dd>{{ $statusCounts['pending'] ?? 0 }}</dd></div>
                    <div><dt>Programados</dt><dd>{{ $statusCounts['scheduled'] ?? 0 }}</dd></div>
                    <div><dt>Realizados</dt><dd>{{ $statusCounts['done'] ?? 0 }}</dd></div>
                </dl>
            </div>
        </section>

        <section class="plan-card" aria-labelledby="plans-upcoming-title">
            <header class="plan-card__head">
                <i class="bi bi-calendar2-week" aria-hidden="true"></i>
                <h2 id="plans-upcoming-title">Próximos planes</h2>
            </header>
            <div class="plan-card__body">
                @forelse ($upcoming as $next)
                    @php $left = $next->daysUntil(); @endphp
                    <a class="plan-mini" href="{{ route('plans.show', $next) }}" wire:navigate>
                        <span class="plan-mini__icon"><i class="bi {{ $next->icon() }}" aria-hidden="true"></i></span>
                        <span class="plan-mini__body">
                            <strong>{{ $next->title }}</strong>
                            <span>{{ \Illuminate\Support\Str::ucfirst($next->scheduled_on->translatedFormat('D, j M Y')) }}</span>
                        </span>
                        <span class="plan-mini__badge">{{ $left === 0 ? 'Hoy' : $left.' '.($left === 1 ? 'día' : 'días') }}</span>
                    </a>
                @empty
                    <p class="plans-muted">Ningún plan tiene fecha próxima.</p>
                @endforelse
            </div>
        </section>

        <section class="plan-card" aria-labelledby="plans-stale-title">
            <header class="plan-card__head">
                <i class="bi bi-hourglass-split" aria-hidden="true"></i>
                <h2 id="plans-stale-title">Hace tiempo que no van</h2>
            </header>
            <div class="plan-card__body">
                @forelse ($stale as $old)
                    <a class="plan-mini" href="{{ route('plans.show', $old) }}" wire:navigate>
                        <span class="plan-mini__icon"><i class="bi {{ $old->icon() }}" aria-hidden="true"></i></span>
                        <span class="plan-mini__body">
                            <strong>{{ $old->title }}</strong>
                            <span>{{ \Illuminate\Support\Str::ucfirst($old->lastVisitLabel()) }} · {{ \App\Models\Plan::visitsLabel((int) $old->visits_count) }}</span>
                        </span>
                        <i class="bi bi-chevron-right plan-mini__trail" aria-hidden="true"></i>
                    </a>
                @empty
                    <p class="plans-muted">Cuando registres visitas verás aquí lo que llevan tiempo sin repetir.</p>
                @endforelse
            </div>
        </section>

        @include('livewire.plan.partials.plan-rail-links', ['links' => $recentLinks, 'id' => 'plans-links-title'])
    </x-slot:rail>

    @include('livewire.plan.partials.plan-dialogs')
</x-module-shell>
