<?php

namespace App\Support\Ui;

class ComponentCatalog
{
    /**
     * Metadatos de cada componente canónico, agrupados por capa del sistema.
     *
     * @var array<string, array{layer: string, title: string, description: string, usage: string}>
     */
    public const ENTRIES = [
        'action' => [
            'layer' => 'primitives',
            'title' => 'Acción',
            'description' => 'Botón o enlace de acción con variantes de énfasis, tonos semánticos, tamaños y estados de carga.',
            'usage' => '<x-ui.action variant="filled" tone="neutral" size="md" icon="bi-plus-lg" wire:click="create">Nueva tarea</x-ui.action>',
        ],
        'icon-action' => [
            'layer' => 'primitives',
            'title' => 'Acción de icono',
            'description' => 'Acción compacta que siempre declara un nombre accesible.',
            'usage' => '<x-ui.icon-action icon="bi-pencil" label="Editar tarea" wire:click="edit" />',
        ],
        'destructive-action' => [
            'layer' => 'primitives',
            'title' => 'Acción destructiva',
            'description' => 'Tratamiento común de las acciones que eliminan información, con confirmación proporcional al riesgo.',
            'usage' => '<x-ui.destructive-action label="Eliminar tarea" action="delete" risk="material" message="Se elimina de forma permanente." />',
        ],
        'field' => [
            'layer' => 'primitives',
            'title' => 'Campo',
            'description' => 'Campo de texto con etiqueta, ayuda, error y relaciones accesibles.',
            'usage' => '<x-ui.field name="title" label="Título" help="Máximo 80 caracteres" wire:model="title" />',
        ],
        'select' => [
            'layer' => 'primitives',
            'title' => 'Selector',
            'description' => 'Selección de una opción entre varias, con las mismas relaciones accesibles que el campo.',
            'usage' => '<x-ui.select name="status" label="Estado" placeholder="Todos" :options="$statuses" wire:model.live="status" />',
        ],
        'textarea' => [
            'layer' => 'primitives',
            'title' => 'Área de texto',
            'description' => 'Entrada de varias líneas para contenido largo.',
            'usage' => '<x-ui.textarea name="notes" label="Notas" rows="3" wire:model="notes" />',
        ],
        'chip' => [
            'layer' => 'primitives',
            'title' => 'Chip',
            'description' => 'Filtro, asistencia, entrada o sugerencia con estado seleccionado y tonos semánticos.',
            'usage' => '<x-ui.chip variant="filter" :selected="$isToday" wire:click="filterToday">Hoy</x-ui.chip>',
        ],
        'badge' => [
            'layer' => 'primitives',
            'title' => 'Badge',
            'description' => 'Conteo o marcador breve asociado a otro elemento.',
            'usage' => '<x-ui.badge tone="danger" label="3 vencidas">3</x-ui.badge>',
        ],
        'card' => [
            'layer' => 'primitives',
            'title' => 'Card',
            'description' => 'Superficie contenedora con encabezado, contenido y acciones.',
            'usage' => '<x-ui.card variant="outlined" title="Resumen" icon="bi-stars">Contenido</x-ui.card>',
        ],
        'progress' => [
            'layer' => 'primitives',
            'title' => 'Progreso',
            'description' => 'Indicador determinado o indeterminado que transmite su valor por custom property.',
            'usage' => '<x-ui.progress :value="$done" :max="$total" tone="success" label="Avance" valueText="60%" />',
        ],
        'icon' => [
            'layer' => 'primitives',
            'title' => 'Icono',
            'description' => 'Iconografía con tono semántico, decorativa u operable por lectores de pantalla.',
            'usage' => '<x-ui.icon name="bi-droplet" tone="info" />',
        ],
        'filter-bar' => [
            'layer' => 'patterns',
            'title' => 'Búsqueda y filtros',
            'description' => 'Patrón canónico de búsqueda, limpieza y rail de chips.',
            'usage' => '<x-ui.filter-bar search="search" placeholder="Buscar tareas" label="Filtros">
    <x-slot:chips>
        <x-ui.chip variant="filter" :selected="$today">Hoy</x-ui.chip>
    </x-slot:chips>
</x-ui.filter-bar>',
        ],
        'filter-menu' => [
            'layer' => 'patterns',
            'title' => 'Menú de filtro',
            'description' => 'Chip con lista de opciones y estado seleccionado.',
            'usage' => '<x-ui.filter-menu name="status" label="Estado" :options="$statuses" :selected="$status" />',
        ],
        'metric' => [
            'layer' => 'patterns',
            'title' => 'Métrica',
            'description' => 'Valor destacado con etiqueta, unidad, apoyo y ausencia de datos.',
            'usage' => '<x-ui.metric label="Hidratación" value="2350" unit="ml" support="Sobre la meta" tone="success" />',
        ],
        'metric-grid' => [
            'layer' => 'patterns',
            'title' => 'Rejilla de métricas',
            'description' => 'Agrupación responsive de métricas equivalentes.',
            'usage' => '<x-ui.metric-grid label="Resumen">
    <x-ui.metric label="Tareas" value="12" />
</x-ui.metric-grid>',
        ],
        'section' => [
            'layer' => 'patterns',
            'title' => 'Sección',
            'description' => 'Bloque con encabezado, descripción y acciones propias.',
            'usage' => '<x-ui.section title="Resumen" description="Últimos siete días" :level="2">
    Contenido
</x-ui.section>',
        ],
        'list' => [
            'layer' => 'patterns',
            'title' => 'Lista',
            'description' => 'Colección de elementos con estructura compartida.',
            'usage' => '<x-ui.list label="Tareas">
    <x-ui.list-item headline="Comprar pan" />
</x-ui.list>',
        ],
        'list-item' => [
            'layer' => 'patterns',
            'title' => 'Elemento de lista',
            'description' => 'Elemento con regiones inicial, principal y final.',
            'usage' => '<x-ui.list-item headline="Comprar pan" supporting="Hoy" href="/tasks/1">
    <x-slot:trailing><x-ui.icon-action icon="bi-pencil" label="Editar" /></x-slot:trailing>
</x-ui.list-item>',
        ],
        'dialog' => [
            'layer' => 'patterns',
            'title' => 'Diálogo',
            'description' => 'Superficie modal con foco contenido y retorno al activador.',
            'usage' => '<x-ui.dialog state="showForm" title="Nueva tarea">
    Contenido
    <x-slot:actions><x-ui.action wire:click="save">Guardar</x-ui.action></x-slot:actions>
</x-ui.dialog>',
        ],
        'sheet' => [
            'layer' => 'patterns',
            'title' => 'Hoja',
            'description' => 'Superficie modal inferior o lateral con el mismo contrato de foco.',
            'usage' => '<x-ui.sheet state="showSheet" title="Registrar" placement="bottom">Contenido</x-ui.sheet>',
        ],
        'snackbar' => [
            'layer' => 'patterns',
            'title' => 'Snackbar',
            'description' => 'Confirmación no modal que anuncia el cambio sin robar el foco.',
            'usage' => '<x-ui.snackbar state="saved">Registro guardado</x-ui.snackbar>',
        ],
        'state' => [
            'layer' => 'patterns',
            'title' => 'Estados de datos',
            'description' => 'Estados inicial, cargando, vacío, sin resultados filtrados y error recuperable.',
            'usage' => '<x-ui.state variant="filtered-empty" message="Ninguna tarea coincide.">
    <x-slot:actions><x-ui.action variant="outlined" wire:click="clearFilters">Limpiar filtros</x-ui.action></x-slot:actions>
</x-ui.state>',
        ],
        'flow-steps' => [
            'layer' => 'archetypes',
            'title' => 'Pasos de flujo guiado',
            'description' => 'Progreso de un flujo guiado con el paso actual anunciado.',
            'usage' => '<x-ui.flow-steps :steps="$steps" :current="$step" label="Reflexión guiada" />',
        ],
    ];

    public const LAYERS = [
        'primitives' => 'Primitivos',
        'patterns' => 'Patrones',
        'archetypes' => 'Arquetipos',
    ];

    /**
     * Componentes canónicos publicados en `resources/views/components/ui`.
     *
     * @return list<string>
     */
    public static function components(): array
    {
        $files = glob(resource_path('views/components/ui/*.blade.php')) ?: [];

        $names = array_map(
            fn (string $file) => str_replace('.blade.php', '', basename($file)),
            $files,
        );

        sort($names);

        return $names;
    }

    /**
     * @return array<string, array<string, array{layer: string, title: string, description: string, usage: string}>>
     */
    public static function byLayer(): array
    {
        $grouped = array_fill_keys(array_keys(self::LAYERS), []);

        foreach (self::ENTRIES as $name => $entry) {
            $grouped[$entry['layer']][$name] = $entry;
        }

        return $grouped;
    }

    public static function has(string $name): bool
    {
        return isset(self::ENTRIES[$name]);
    }

    public static function entry(string $name): array
    {
        return self::ENTRIES[$name] + ['name' => $name];
    }

    public static function examplePartial(string $name): string
    {
        return "ui.catalog.entries.{$name}";
    }
}
