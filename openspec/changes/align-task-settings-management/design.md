# Design

## Context

Ver `proposal.md` para la motivación. `TaskSettings` presenta categorías como colección jerárquica y estados agrupados por tipo; ambas vistas utilizan listas. Planes ya combina `management-card` con una navegación local derecha. `_tasks.css` declara actualmente dos columnas desde 768 px y se importa en `resources/css/app.css`; por ello la captura no demuestra por sí sola un defecto de esa regla local.

## Goals / Non-Goals

**Goals:** reutilizar el contrato compartido de gestión sin alterar semántica de datos, orden y acciones; comprobar el resultado con assets compilados y fixtures aislados.

**Non-Goals:** cambiar el esquema, los catálogos iniciales de cuentas, el comportamiento de otros módulos, las reglas de eliminación o el sistema global de rails; crear tags de tareas porque Planes los tenga; desplegar o modificar datos reales.

## Decisions

1. **Tarjeta y tabla canónicas.** Usar `x-ui.management-card`, `WithManagementCard`, `md-table md-table--stack` y `x-ui.row-actions`. Mantener formularios y FAB actuales. Una tabla por sección con columna Tipo para estados sustituye los bloques separados sin perder la clasificación. Se descarta estilizar las listas actuales porque duplicaría el contrato de búsqueda, header y paginación.

2. **Navegación propia de ajustes.** Conservar las rutas `tasks.settings` y `tasks.settings.statuses` y una tarjeta lateral local, siguiendo el layout de Planes: columna flexible y navegación de 260 px, gap de 24 px; a menos de 768 px la navegación pasa arriba. No habilitar un rail global para todas las vistas de Tareas. Ajustar únicamente selectores de ajustes y verificar el ancho efectivo del contenedor.

3. **Derivar resultados de un catálogo completo y personal.** Incorporar búsqueda `q` y paginación con el trait compartido. Para categorías, partir del orden jerárquico completo existente, filtrar por nombre o ruta visible y paginar la colección resultante. Para estados, aplanar los grupos en el orden vigente de tipos y `sort_order`, luego filtrar y paginar. Reutilizar el paginador de colecciones evita reconstruir la jerarquía mediante SQL. El contador corresponde al resultado filtrado; los contadores de tareas de cada fila conservan su ámbito actual. Al cambiar búsqueda o tamaño de página, reiniciar página; tras borrar o reducir resultados, normalizar una página fuera de rango.

4. **Separar filas visibles y vecinos reales.** Calcular disponibilidad de Subir/Bajar antes de filtrar y paginar, respetando exactamente el conjunto ordenable que utilizan `ManageTaskCategories` y `ManageTaskStatuses`. No usar `$loop->first/last` de la página para esas acciones. Conservar protección de jerarquía y movimiento dentro del tipo. Se descarta ordenar alfabéticamente tras buscar, pues ocultaría el efecto del orden manual.

5. **Retirar la acción completa del panel.** Eliminar las dos entradas Blade, el método público `restoreDefaults` y su importación si queda sin uso. Mantener `DefaultTaskCategories` y su uso fuera del panel. Conservar la inicialización necesaria de estados y las acciones existentes de reasignación.

## Risks / Trade-offs

- [La captura de producción difiere del CSS local] → reproducir con build local, revisar carga de assets y geometría; documentar lo verificado y dejar la comprobación de producción pendiente si no hay acceso autorizado. No atribuir el problema a caché sin evidencia.
- [Paginación oculta padres o vecinos] → conservar la ruta jerárquica visible y calcular vecinos antes de paginar; probar movimientos en página intermedia y búsqueda.
- [La colección completa crece] → mantener el enfoque actual de lectura para no alterar la jerarquía; no añadir consultas por cada fila; evaluar otra estrategia únicamente si aparece evidencia de volumen problemático.
- [Cambiar la presentación rompe restricciones] → reutilizar acciones y diálogos existentes y ejecutar pruebas focalizadas de estados, jerarquía y aislamiento.
- [Regresión visual en otras vistas de Tareas] → mantener selectores acotados a ajustes y comprobar una vista de lista como control.

## Migration Plan

No requiere migraciones ni modificaciones de registros. La implementación local actualizará componente, vistas y estilos, compilará assets y pasará las validaciones focalizadas. Un eventual despliegue será una acción posterior autorizada e incluirá los assets generados. Revertir el cambio de código y reconstruir assets permite volver al comportamiento anterior sin restaurar datos.
