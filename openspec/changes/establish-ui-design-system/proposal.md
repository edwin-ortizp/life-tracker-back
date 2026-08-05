## Why

Life Tracker ya cuenta con tokens Material Design 3, estilos compartidos y un shell común, pero cada módulo todavía puede resolver componentes, estados y composición visual de forma independiente. Esa libertad ha producido estilos inline, patrones heredados y controles equivalentes con apariencias distintas; si no se corrige antes de ampliar Relaciones y el flujo emocional, la deuda visual seguirá creciendo.

## What Changes

- Formalizar un sistema de diseño de Life Tracker con tokens semánticos, componentes Blade canónicos y variantes documentadas.
- Definir arquetipos compartidos para listados, detalles, dashboards, registros diarios, configuración y flujos guiados.
- Incorporar un catálogo interno que muestre componentes, variantes, estados interactivos y comportamiento responsive.
- Establecer reglas de conformidad para impedir nuevos colores directos, patrones obsoletos y estilos locales evitables.
- Añadir controles automáticos de estructura, accesibilidad y regresión visual en vistas representativas.
- Migrar incrementalmente las superficies existentes, priorizando los patrones reutilizados por los cambios de Relaciones y emociones.
- Retirar estilos y variantes heredadas únicamente después de migrar todos sus consumidores.

## Capabilities

### New Capabilities

- `design-system-foundation`: Contrato de tokens, componentes visuales canónicos, variantes semánticas y estados compartidos de interfaz.
- `screen-composition`: Arquetipos de pantalla y reglas responsive para componer módulos coherentes sin eliminar sus diferencias funcionales.
- `ui-quality-governance`: Catálogo visual, reglas automatizadas, accesibilidad y regresión visual que impiden introducir nuevas desviaciones.

### Modified Capabilities

Ninguna.

## Impact

- Afecta `resources/css/m3`, `resources/views/components`, vistas Blade/Livewire y las convenciones de composición de nuevos módulos.
- Amplía las pruebas de experiencia existentes y añade herramientas de inspección estática, accesibilidad y capturas visuales responsive.
- Puede incorporar una dependencia de desarrollo para pruebas de navegador y accesibilidad, sin cambiar las APIs públicas ni el modelo de datos.
- Los cambios OpenSpec `expand-relationship-management` y `connect-emotions-with-relationships` consumirán los componentes y patrones resultantes en sus nuevas superficies visuales.
