## Context

El módulo actual usa `Relationship` como entidad de persona, un círculo principal, campos parciales de cumpleaños y asociaciones polimórficas con `Task`. La pantalla Livewire existente solo cubre el listado y una edición mínima. `RelationshipEvent` existe, pero no se utiliza y su nombre convencional de tabla no coincide con la tabla histórica `events`.

La solución debe seguir los patrones de páginas Livewire, filtros Material Design 3, estado de filtros en URL, UUID y aislamiento mediante `BelongsToUser`. Véase `proposal.md` para la motivación y las especificaciones del cambio para el contrato observable.

## Goals / Non-Goals

**Goals:**

- Evolucionar los datos actuales sin perder relaciones, cumpleaños ni tareas asociadas.
- Separar perfiles, acontecimientos y acciones con responsabilidades claras.
- Representar fechas imprecisas sin inventar precisión y ordenar sus ventanas temporales eficientemente.
- Mantener los datos sensibles fuera de superficies globales salvo elección explícita.
- Reutilizar el módulo de Tareas como única fuente de verdad para recordatorios.

**Non-Goals:**

- Crear una libreta de direcciones sincronizada con proveedores externos.
- Implementar notificaciones push, correo o mensajería.
- Inferir datos personales, relaciones o recordatorios automáticamente.
- Crear un subsistema independiente de tareas dentro de Relaciones.

## Decisions

### Mantener Relationship como agregado principal y “Relaciones” en la interfaz

Se conservarán el modelo y la tabla `relationships`; renombrarlos a contactos produciría una migración amplia sin aportar comportamiento. La navegación, títulos y lenguaje de la interfaz seguirán usando “Relaciones”, mientras cada registro representa una persona conocida por el usuario.

Alternativa considerada: crear un nuevo agregado `Contact`. Se descarta porque duplicaría datos y asociaciones ya existentes, y reduciría la continuidad con círculos y seguimiento de contacto.

### Separar datos repetibles en entidades hijas

Los medios de contacto se almacenarán en una tabla hija con tipo, etiqueta, valor, indicador principal y orden. Las etiquetas tendrán una tabla propia y una relación muchos-a-muchos con relaciones; el círculo principal continuará como asociación singular para preservar el significado existente.

Los campos personales escalares permanecerán en `relationships`. La fecha de nacimiento se normalizará como año nullable, mes y día; los valores actuales de `birthday_date` o `birthday_month`/`birthday_day` se migrarán sin inventar el año.

Alternativa considerada: guardar medios, etiquetas y datos personales en el JSON `notes`. Se descarta porque impediría validación, búsquedas eficientes, unicidad de principales y relaciones Eloquent claras.

### Normalizar acontecimientos en relationship_events

La tabla histórica `events` se renombrará a `relationship_events` para concordar con el dominio y evitar colisiones futuras con otros tipos de evento. Se migrarán sus registros antes de añadir la nueva semántica.

Cada acontecimiento tendrá categoría, título, notas, indicador sensible, estado de archivo, `date_precision` y una ventana `starts_on`/`ends_on`. Una fecha exacta usa el mismo inicio y fin; un mes se normaliza internamente al primer y último día de ese mes; un año al inicio y fin del año; y un intervalo conserva sus extremos. La interfaz siempre renderiza según `date_precision`, de modo que los límites internos nunca se presentan como fechas aportadas por el usuario.

Alternativa considerada: columnas nullable separadas para año, mes, día e intervalos. Se descarta porque complica ordenamiento, solapamiento de periodos y consultas de próximos acontecimientos.

### Sensibilidad explícita y exclusión por defecto

`is_sensitive` será una decisión explícita por acontecimiento. Las consultas de la página individual incluyen los sensibles porque ya están dentro del contexto deliberado de esa persona. Las consultas globales, widgets y resúmenes aplican `is_sensitive = false` de manera predeterminada; la vista global ofrece un filtro explícito y no persistente como preferencia general.

Esto no sustituye autorización: todos los accesos continuarán restringidos al propietario mediante scopes y validación de relaciones compuestas.

Alternativa considerada: hacer sensible toda la categoría Salud. Se descarta porque algunas citas o hitos de salud pueden no requerir ocultamiento, mientras otras categorías también podrían contener información íntima.

### Reutilizar Task y TaskAssociation

Los recordatorios serán registros `Task` normales asociados a `Relationship` mediante `TaskAssociation`. El detalle consulta las tareas reales, por lo que completar o editar desde Tareas se refleja inmediatamente. Un acontecimiento no crea una tarea salvo acción explícita. Al borrar una relación se elimina la asociación, no la tarea.

La frecuencia de contacto se calcula desde `last_contact_at` y la frecuencia del perfil o, si no existe, la del círculo. El sistema presenta una sugerencia y una acción para crear tarea, sin generación automática.

Alternativa considerada: una tabla `relationship_reminders`. Se descarta porque duplicaría estados, fechas y comportamiento ya resueltos por Tareas.

### Dividir el módulo en rutas y componentes enfocados

El shell de Relaciones tendrá tabs para lista, acontecimientos y cumpleaños, y una ruta de detalle por relación. Los filtros usarán los componentes M3 prescritos y parámetros de URL validados. El detalle concentrará perfil, cronología y pendientes para no sobrecargar el listado.

Las operaciones de formularios se implementarán en componentes Livewire con reglas de validación explícitas y consultas eager-loaded para evitar N+1 en listados.

## Risks / Trade-offs

- [La tabla genérica `events` podría contener datos inesperados] → Auditar conteos y claves antes del renombrado, migrar de forma reversible y verificar integridad referencial.
- [La normalización de fechas parciales usa límites internos que no fueron introducidos literalmente] → Conservar `date_precision` como fuente de presentación y probar que nunca se muestre precisión inventada.
- [Buscar entre múltiples medios de contacto puede degradar el listado] → Añadir índices por propietario, tipo y valor normalizado, y paginar resultados.
- [Información sensible puede filtrarse por nuevas superficies futuras] → Centralizar scopes de visibilidad global y cubrir widgets, búsquedas y vistas con pruebas negativas.
- [La eliminación permanente puede dejar tareas sin contexto] → Mantener las tareas por diseño, informar al usuario antes de borrar y eliminar únicamente las asociaciones.
- [Cambios amplios en un componente existente pueden dificultar mantenimiento] → Separar lista, detalle, acontecimientos y cumpleaños en componentes de página independientes.

## Migration Plan

1. Auditar la tabla `events` y respaldar su estructura lógica mediante pruebas de migración.
2. Crear las tablas de medios de contacto, etiquetas y pivote con claves compuestas que respeten el propietario.
3. Añadir los nuevos campos del perfil y normalizar cumpleaños existentes, conservando valores desconocidos como null.
4. Renombrar `events` a `relationship_events`, transformar fechas existentes en ventanas exactas y añadir categoría, notas, precisión y sensibilidad con valores predeterminados seguros.
5. Desplegar modelos y componentes compatibles con la estructura migrada.
6. Verificar conteos de relaciones, cumpleaños, acontecimientos y asociaciones con tareas antes de retirar campos obsoletos si corresponde.

Para rollback, las migraciones revertirán tablas nuevas y el nombre de acontecimientos. Los campos históricos solo se retirarán en una migración posterior a la verificación, permitiendo que el primer rollback conserve los datos originales.
