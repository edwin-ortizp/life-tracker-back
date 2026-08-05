## Purpose

Establecer un lenguaje visual compartido y verificable para que controles y estados equivalentes se perciban y se comporten igual en todos los módulos de Life Tracker.

## ADDED Requirements

### Requirement: Propiedades visuales gobernadas por tokens semánticos
La interfaz SHALL obtener colores, tipografía, espaciado, formas, elevación y movimiento desde tokens compartidos con nombres semánticos. Las vistas de módulo SHALL NOT introducir valores visuales directos cuando exista un token equivalente.

#### Scenario: Un módulo necesita representar un estado de error
- **WHEN** una pantalla presenta texto, borde, icono o superficie de error
- **THEN** todos esos elementos usan los tokens semánticos de error definidos por el sistema

#### Scenario: Se necesita un valor visual que todavía no existe
- **WHEN** una necesidad válida no puede expresarse con los tokens disponibles
- **THEN** el token se incorpora al contrato compartido antes de ser consumido por una pantalla

### Requirement: Componentes canónicos para patrones repetidos
El sistema SHALL proporcionar componentes canónicos para búsqueda y filtros, acciones, métricas, secciones, listas, campos de formulario, diálogos, hojas, snackbars, chips de estado y estados vacío, cargando y error. Una pantalla SHALL reutilizar el componente canónico cuando represente el mismo propósito e interacción.

#### Scenario: Dos módulos ofrecen búsqueda y filtros
- **WHEN** el usuario abre listados con capacidades equivalentes de búsqueda y filtrado
- **THEN** ambos presentan la misma jerarquía, estados seleccionados, controles de limpieza y comportamiento de teclado

#### Scenario: Un módulo requiere una variación legítima
- **WHEN** el contenido necesita una diferencia visual soportada por el sistema
- **THEN** la pantalla selecciona una variante semántica documentada sin redefinir localmente la estructura o el estilo base

### Requirement: Estados interactivos completos y accesibles
Todo componente interactivo SHALL definir estados normal, hover, focus-visible, pressed, disabled, loading y error cuando sean aplicables, conservando nombre accesible, contraste suficiente y foco perceptible.

#### Scenario: Navegación exclusiva por teclado
- **WHEN** el usuario recorre controles mediante teclado
- **THEN** el orden de foco es lógico, cada control muestra foco visible y todas las acciones principales son operables sin puntero

#### Scenario: Acción temporalmente no disponible
- **WHEN** una operación está cargando o el control está deshabilitado
- **THEN** el estado es perceptible visualmente y comunicado mediante semántica accesible sin permitir activaciones duplicadas

### Requirement: Comportamiento coherente de acciones destructivas
Las acciones destructivas SHALL usar una variante semántica común y SHALL solicitar confirmación proporcional al riesgo antes de eliminar información material.

#### Scenario: Eliminación de un registro persistente
- **WHEN** el usuario activa una acción que elimina un registro
- **THEN** la interfaz identifica claramente la acción destructiva y solicita confirmación antes de ejecutarla

