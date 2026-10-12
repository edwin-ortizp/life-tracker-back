# Planes: alineación con el mockup

El módulo web ofrece Todos, Programados, Historial y Ajustes. Programados comienza desde hoy y permite consultar otros intervalos. Historial consulta visitas y permite eliminarlas sin cambiar el estado del plan. Ajustes administra categorías y tags personales; no permite eliminar elementos asociados a planes.

## Migración y compatibilidad

La migración `2026_10_12_000002_create_plan_categories_table.php` crea el catálogo por usuario, consolida espacios y mayúsculas de las categorías existentes y asocia los planes. Conserva la columna textual `category`; `SavePlan` la sincroniza y sigue aceptando texto desde MCP. Renombrar una categoría actualiza ese texto en sus planes. La clave foránea compuesta impide asociar categorías de otro propietario. El rollback elimina el catálogo y conserva los nombres en los planes.

Aplicar las migraciones pendientes mediante el procedimiento habitual de despliegue, antes de utilizar las pantallas nuevas. No se ejecutaron migraciones en producción. La base MySQL local de esta sesión no estaba disponible; la migración y el rollback se verificaron en SQLite aislado.

## Componentes y validación

`module-shell` admite `active-route` y `navigation-query` para conservar la pestaña y los filtros tras actualizaciones Livewire. Cada pestaña puede declarar su lista `preserve`. Las opciones son compatibles con los consumidores existentes.

`x-ui.icon-picker` recibe `name`, `value` y `options`; busca localmente, permite entrar a los resultados con flecha abajo y seleccionar con Enter o espacio. El catálogo versionado `resources/data/bootstrap-icons.json` proviene de los nombres de `node_modules/bootstrap-icons/font/bootstrap-icons.json`; actualizarlo cuando se cambie esa dependencia.

Pruebas: `php artisan test --filter="PlanModuleTest|LifeTrackerPlanMcpTest"`, `npx playwright test -c tests/Browser/plans.config.js`, `npm run build`, `php artisan ui:conformance` y `git diff --check`. La suite de navegador usa exclusivamente `storage/framework/testing/plan-browser.sqlite` y el puerto 8028.
