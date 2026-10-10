<x-module-shell module="meals">
    <x-slot:actions><x-module-actions :primary="['label' => 'Generar compras del plan', 'icon' => 'bi-cart-plus', 'event' => 'meal-shopping-preview']" /></x-slot:actions>
    <div class="row g-3 mb-3">
        <div class="col-md-6"><x-ui.field label="Porciones a cocinar" name="portions" type="number" min="0.01" step="0.01" wire:model.live.debounce.300ms="portions" /></div>
        <div class="col-md-6"><x-ui.field label="Próximos días de vencimiento" name="days" type="number" min="0" max="365" wire:model.live.debounce.300ms="days" /></div>
    </div>
    <section class="md-card-elevated mb-3">
        <h2 class="md-title-medium">Vencimientos del inventario</h2>
        <p>Fechas generales de productos y preparaciones; no se gestionan lotes. Son avisos y no bloquean el consumo.</p>
        @foreach (['expired_products' => 'Productos vencidos', 'expiring_products' => 'Productos próximos a vencer', 'expired_preparations' => 'Preparaciones vencidas', 'expiring_preparations' => 'Preparaciones próximas a vencer'] as $key => $label)
            <h3 class="md-title-small">{{ $label }}</h3>
            @forelse ($suggestions[$key] as $row)<p>{{ $row['name'] }} · {{ $row['consume_by'] }} · {{ $row['stock'] ?? $row['remaining'] }} {{ $row['unit'] ?? 'porciones' }}</p>@empty<p>Sin registros en este intervalo.</p>@endforelse
        @endforeach
    </section>
    <x-ui.management-card title="Qué puedo cocinar" icon="bi-lightbulb" :count="$recipes->total()" :paginator="$recipes" noun="recetas">
        <x-ui.list label="Recetas según inventario">@forelse ($recipes as $recipe)
                <x-ui.list-item :headline="$recipe['name']" wire:key="suggested-recipe-{{ $recipe['id'] }}">
                    <p>{{ $recipe['portions'] }} porciones · {{ $recipe['incomplete'] ? 'Datos incompletos' : ($recipe['can_cook'] ? 'Puedes cocinarla' : 'Faltan ingredientes') }}</p>
                    @foreach ($recipe['ingredients'] as $ingredient)<p>{{ $ingredient['name'] }}: {{ $ingredient['quantity'] ?? '?' }} {{ $ingredient['unit'] }} · faltan {{ $ingredient['missing'] ?? '?' }}</p>@endforeach
                </x-ui.list-item>
            @empty<li>Sin recetas guardadas.</li>@endforelse
        </x-ui.list>
    </x-ui.management-card>
    <livewire:meal.meal-plan-shopping-editor :key="'suggestions-shopping-editor'" />
</x-module-shell>
