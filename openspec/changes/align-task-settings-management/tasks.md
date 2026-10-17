# Tasks

## 1. Retirada de restauración

- [x] 1.1 Eliminar las dos entradas de restauración/agregado predeterminado, el método público y la importación sin uso de TaskSettings; actualizar pruebas de TaskSettingsTest para verificar ausencia con y sin categorías y rechazo de invocación directa sin escrituras, y ejecutar `php artisan test --filter=TaskSettingsTest`.

## 2. Consulta, paginación y acciones

- [x] 2.1 Integrar WithManagementCard y búsqueda por nombre/ruta en ambos catálogos, preservando orden jerárquico y orden por tipo; añadir pruebas de búsqueda, 10/25/50/100 filas, reinicio y normalización de página, contadores sin historial de recurrencias y aislamiento entre dos usuarios; verificar con `php artisan test --filter=TaskSettingsTest`.
- [x] 2.2 Derivar disponibilidad de movimiento desde el catálogo completo y conservar acciones de gestión; probar vecinos ocultos por búsqueda, cambio de página, límites reales, jerarquía, movimiento dentro del tipo, estados protegidos y reasignación; ejecutar las pruebas afectadas de TaskSettingsTest, TaskStatusesTest y jerarquía identificadas en el repositorio.

## 3. Tablas y navegación responsive

- [x] 3.1 Sustituir las listas por management-card y tablas canónicas con las columnas especificadas, contador, búsqueda, ⋮, pie, estados vacíos y split buttons; conservar FAB y form-dialog; verificar render y apertura/cierre de creación, edición y reasignación en ambas secciones mediante pruebas focalizadas.
- [x] 3.2 Alinear navegación local con Planes y acotar los estilos a ajustes; compilar con `npm run build`, comprobar assets cargados y geometría de ambas rutas a 1280 y 1600 px con tarjeta derecha y a 390 px con navegación arriba; registrar evidencias y distinguir cualquier discrepancia de producción aún no verificada.
- [x] 3.3 Añadir o adaptar comprobaciones Browser de búsqueda compacta, teclado, foco, menús, diálogos y ausencia de desbordamiento para ambos catálogos con fixtures aislados; ejecutar los casos focalizados de interacción, accesibilidad y responsive según el contrato UI vigente.
- [x] 3.4 Documentar la incorporación de ajustes de Tareas al patrón de gestión en la sección pertinente de docs/design-system.md; verificar referencias y coherencia con los componentes utilizados.

## 4. Integración y cierre

- [x] 4.1 Ejecutar `php artisan ui:conformance`, comprobar visualmente una vista de lista de Tareas y ajustes de Planes como controles de regresión, y resolver únicamente regresiones causadas por este cambio; verificar que no se alteraron estilos compartidos innecesariamente.
- [x] 4.2 Ejecutar `openspec validate align-task-settings-management --strict` y `git diff --check` sobre los archivos modificados, revisar el diff final y entregar resumen de validaciones, evidencias y pendientes de producción sin commit, migración ni despliegue.
