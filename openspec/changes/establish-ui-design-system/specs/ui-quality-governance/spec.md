## Purpose

Convertir la coherencia visual, responsive y accesible en una condición automática de entrega, con una referencia observable para diseñar y revisar componentes.

## ADDED Requirements

### Requirement: Catálogo visual de componentes
El sistema SHALL ofrecer en entornos de desarrollo y prueba un catálogo navegable que muestre cada componente canónico, sus variantes, estados interactivos, densidades de contenido y comportamiento responsive. El catálogo SHALL NOT quedar expuesto públicamente en producción.

#### Scenario: Consulta de un componente antes de usarlo
- **WHEN** una persona desarrolla o revisa una pantalla en un entorno permitido
- **THEN** puede consultar el componente con ejemplos de uso, variantes soportadas y estados relevantes

#### Scenario: Solicitud del catálogo en producción
- **WHEN** un visitante intenta acceder al catálogo en el entorno de producción
- **THEN** el sistema no expone la ruta ni su contenido

### Requirement: Conformidad estática automatizada
La verificación automática SHALL detectar en vistas nuevas o modificadas patrones obsoletos, colores directos, estilos inline evitables y sustituciones locales de componentes canónicos. Las excepciones SHALL ser explícitas, mínimas y documentadas con motivo.

#### Scenario: Una vista introduce un patrón prohibido
- **WHEN** una contribución agrega una clase heredada o un valor visual directo sin excepción válida
- **THEN** la verificación falla e identifica archivo, ubicación y regla incumplida

#### Scenario: Un valor dinámico requiere estilo calculado
- **WHEN** una visualización necesita transmitir un valor calculado que no puede resolverse mediante variantes discretas
- **THEN** la regla permite una custom property limitada y documentada sin permitir declaraciones visuales arbitrarias

### Requirement: Regresión visual responsive
El sistema SHALL mantener referencias visuales automatizadas de componentes y pantallas representativas en viewports móvil, tableta y escritorio. Una diferencia no aprobada SHALL impedir considerar conforme el cambio.

#### Scenario: Cambio visual accidental
- **WHEN** una modificación altera una captura de referencia sin actualizar deliberadamente su baseline
- **THEN** la prueba falla y presenta la diferencia visual para revisión

#### Scenario: Cambio visual aprobado
- **WHEN** la diferencia corresponde a una decisión de diseño revisada
- **THEN** las referencias se actualizan de forma explícita junto con la contribución que introduce el cambio

### Requirement: Verificación automatizada de accesibilidad
Los componentes canónicos y pantallas representativas SHALL superar verificaciones automáticas de nombres accesibles, relaciones de etiqueta, estructura semántica, contraste detectable, atributos de estado y navegación básica por teclado.

#### Scenario: Control sin nombre accesible
- **WHEN** una pantalla renderiza un botón, campo o enlace sin nombre accesible
- **THEN** la prueba de accesibilidad falla antes de la entrega

#### Scenario: Diálogo abierto
- **WHEN** una prueba abre un diálogo canónico
- **THEN** el foco entra al diálogo, permanece contenido durante la interacción y vuelve al activador después de cerrarlo

### Requirement: Adopción incremental sin nueva deuda
La migración SHALL mantener un inventario inicial de desviaciones existentes y SHALL impedir que una contribución aumente ese inventario. Una pantalla modificada sustancialmente SHALL migrar los patrones que toca al contrato vigente.

#### Scenario: Cambio no relacionado en una pantalla heredada
- **WHEN** una contribución no modifica la región que contiene una desviación inventariada
- **THEN** la desviación puede permanecer temporalmente sin que se autoricen desviaciones nuevas

#### Scenario: Cambio sustancial sobre un patrón heredado
- **WHEN** una contribución modifica la estructura o interacción de un patrón inventariado
- **THEN** ese patrón se migra al componente canónico y se elimina del inventario de deuda

