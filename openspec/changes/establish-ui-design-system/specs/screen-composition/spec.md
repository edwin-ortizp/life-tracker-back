## Purpose

Definir estructuras de pantalla reconocibles y adaptables para que cada módulo conserve su identidad funcional sin romper la experiencia general de Life Tracker.

## ADDED Requirements

### Requirement: Arquetipo explícito para cada pantalla
Cada pantalla de página completa SHALL componerse mediante el shell compartido y SHALL declarar o seguir uno de los arquetipos aprobados: listado, detalle, dashboard, registro diario, configuración o flujo guiado.

#### Scenario: Nuevo listado de módulo
- **WHEN** se incorpora una pantalla cuyo propósito principal es buscar y recorrer registros
- **THEN** presenta encabezado y acciones, búsqueda y filtros, colección, paginación cuando aplique y contexto secundario siguiendo el arquetipo de listado

#### Scenario: Pantalla con necesidades excepcionales
- **WHEN** una pantalla no encaja razonablemente en un arquetipo existente
- **THEN** se documenta y aprueba un nuevo arquetipo reutilizable antes de introducir una composición aislada

### Requirement: Jerarquía consistente de información y acciones
Las pantallas SHALL ubicar título, navegación local, acción primaria, acciones secundarias, contenido principal y contexto en regiones consistentes. Cada pantalla SHALL tener como máximo una acción primaria visualmente dominante por contexto.

#### Scenario: Pantalla con varias operaciones disponibles
- **WHEN** el usuario puede crear, importar, exportar y configurar desde la misma pantalla
- **THEN** solo la operación principal recibe énfasis dominante y las demás se presentan como acciones secundarias o contextuales

#### Scenario: Navegación entre pestañas de un módulo
- **WHEN** el usuario cambia de vista dentro del mismo módulo
- **THEN** se conservan la identidad del módulo, la ubicación de navegación y los parámetros de contexto declarados

### Requirement: Adaptación responsive sin pérdida funcional
Cada arquetipo SHALL conservar contenido, acciones esenciales, legibilidad y orden lógico en anchos de referencia móvil, tableta y escritorio. El contexto lateral SHALL reubicarse en el flujo principal cuando no exista espacio suficiente.

#### Scenario: Listado en pantalla móvil
- **WHEN** el ancho disponible corresponde al viewport móvil de referencia
- **THEN** búsqueda, filtros, acción primaria y elementos del listado permanecen operables sin desplazamiento horizontal de la página

#### Scenario: Rail contextual sin espacio lateral
- **WHEN** el viewport no permite mostrar contenido principal y rail en paralelo
- **THEN** el rail se reubica después del contenido principal manteniendo orden semántico y acceso a toda su información

### Requirement: Estados de pantalla completos
Toda superficie que dependa de datos SHALL contemplar, cuando apliquen, los estados inicial, cargando, con contenido, vacío, sin resultados filtrados y error recuperable mediante patrones compartidos.

#### Scenario: Filtro sin coincidencias
- **WHEN** existen registros pero los filtros activos no producen resultados
- **THEN** la pantalla diferencia este estado de una colección realmente vacía y ofrece limpiar o ajustar filtros

#### Scenario: Error recuperable al cargar
- **WHEN** una operación de lectura falla sin invalidar la sesión
- **THEN** la pantalla conserva su estructura, explica el problema en lenguaje útil y ofrece reintentar

### Requirement: Densidad y contenido variables
Los arquetipos SHALL admitir textos extensos, valores ausentes y colecciones de tamaño variable sin superposición, truncamiento destructivo ni cambios arbitrarios de jerarquía.

#### Scenario: Etiqueta o título extenso
- **WHEN** el contenido excede el tamaño habitual o aumenta por configuración de texto
- **THEN** la pantalla mantiene legibilidad y acceso al contenido completo sin ocultar acciones esenciales

