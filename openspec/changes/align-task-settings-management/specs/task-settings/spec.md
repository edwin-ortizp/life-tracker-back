# Spec Delta

## Purpose

Permitir administrar las categorías y los estados personales de tareas con una presentación de gestión coherente, compacta, accesible y adaptable al ancho disponible.

## ADDED Requirements

### Requirement: Navegación de ajustes responsive
El sistema SHALL ofrecer Categorías de tareas y Estados de tareas en una tarjeta de navegación a la derecha del contenido desde 768 px y encima del contenido a menor ancho, indicando la sección activa y conservando sus rutas existentes.

#### Scenario: Navegación en escritorio
- **WHEN** el usuario abre cualquiera de las secciones con un viewport de 1280 px
- **THEN** la navegación aparece a la derecha, alineada arriba con la tarjeta de gestión, y marca la sección activa

#### Scenario: Navegación móvil
- **WHEN** el usuario abre ajustes con un viewport de 390 px
- **THEN** la navegación aparece antes de la tabla y permite cambiar de sección sin desbordamiento horizontal de la página

### Requirement: Catálogos en tarjeta de gestión
Cada sección SHALL presentar una tarjeta con icono, título, contador, búsqueda por nombre, menú ⋮ con actualización y paginación de 10, 25, 50 o 100 filas, con 25 por defecto. La tabla de categorías SHALL mostrar Nombre, Pendientes, Total y Acciones; la de estados SHALL mostrar Nombre, Tipo, Tareas y Acciones.

#### Scenario: Consultar categorías
- **WHEN** el usuario abre Categorías de tareas
- **THEN** ve la ruta jerárquica de cada categoría, sus cantidades de tareas pendientes y totales excluyendo historial de recurrencias, y sus acciones
- **AND** la información de tareas sin categoría se conserva separada de las filas de categorías

#### Scenario: Consultar estados
- **WHEN** el usuario abre Estados de tareas
- **THEN** ve cada estado con su tipo y cantidad de tareas excluyendo historial de recurrencias

#### Scenario: Buscar y paginar
- **WHEN** el usuario cambia la búsqueda o las filas por página
- **THEN** la vista vuelve a la primera página y actualiza filas, contador y pie de paginación de acuerdo con el resultado

#### Scenario: Sin resultados
- **WHEN** la búsqueda no coincide con ningún elemento
- **THEN** aparece un estado de búsqueda sin resultados distinto del catálogo vacío y el usuario puede limpiar la búsqueda

### Requirement: Acciones y orden del catálogo
Las filas SHALL ofrecer Editar como acción principal del split button y acciones secundarias en su menú, con la adaptación compacta habitual. Subir y Bajar SHALL operar sobre el orden completo permitido del catálogo, independientemente de la búsqueda o paginación. Los estados SHALL conservar el orden por tipo y su movimiento dentro del tipo.

#### Scenario: Movimiento desde una búsqueda
- **WHEN** el usuario mueve un elemento mientras otros elementos están ocultos por búsqueda o paginación
- **THEN** el movimiento usa sus vecinos reales en el orden del catálogo, sin tratar el límite de resultados como límite del orden

#### Scenario: Límites del orden
- **WHEN** un elemento es el primero o último de su conjunto ordenable completo
- **THEN** no se ofrece respectivamente Subir o Bajar

### Requirement: Creación y edición mediante diálogo
La creación SHALL realizarse desde el FAB contextual mediante un diálogo sobre la pantalla actual. Editar SHALL abrir el diálogo del elemento seleccionado. Los estados vacíos SHALL remitir al FAB sin duplicar botones de creación.

#### Scenario: Crear desde una sección
- **WHEN** el usuario pulsa el FAB de categorías o estados
- **THEN** se abre el formulario correspondiente y cerrar el diálogo conserva la pantalla de ajustes

### Requirement: Restauración no disponible en ajustes
El panel SHALL carecer de las opciones Restaurar predeterminadas y Agregar predeterminadas, incluso con el catálogo vacío. La acción de restauración SHALL dejar de estar disponible para invocación directa desde este panel.

#### Scenario: Catálogo vacío
- **WHEN** el usuario abre categorías sin registros
- **THEN** puede crear una categoría mediante el FAB y no se ofrece agregar categorías predeterminadas

#### Scenario: Invocación directa de restauración
- **WHEN** un cliente intenta ejecutar la antigua acción de restauración del panel
- **THEN** la acción no está disponible y no se crean categorías

### Requirement: Preservación de reglas y aislamiento
La gestión SHALL limitar consultas, contadores y escrituras al usuario autenticado y conservar las reglas existentes de jerarquía, renombrado, eliminación y reasignación. El único estado terminado y el último estado por hacer SHALL conservar su protección frente a eliminación.

#### Scenario: Aislamiento entre usuarios
- **WHEN** un usuario consulta ajustes o intenta actuar sobre identificadores de otro usuario
- **THEN** no ve ni modifica sus catálogos ni obtiene sus contadores

#### Scenario: Eliminar elementos en uso
- **WHEN** el usuario elimina una categoría o estado eliminable que tiene tareas
- **THEN** se conserva el diálogo y las opciones válidas de reasignación existentes antes de confirmar la eliminación

#### Scenario: Estados protegidos
- **WHEN** el usuario administra el estado terminado o el último estado por hacer
- **THEN** se conservan las restricciones existentes tanto en las acciones visibles como en el servidor

### Requirement: Accesibilidad de la gestión
La interfaz SHALL permitir navegación por teclado con foco visible, identificar la sección activa y los controles por nombre accesible, y adaptar tablas, header, menús y diálogos al ancho disponible sin ocultar acciones necesarias.

#### Scenario: Interacción compacta por teclado
- **WHEN** el usuario busca, abre acciones y edita desde un viewport móvil utilizando teclado
- **THEN** puede completar la interacción, cerrar los elementos emergentes y recuperar el foco sin quedar atrapado
