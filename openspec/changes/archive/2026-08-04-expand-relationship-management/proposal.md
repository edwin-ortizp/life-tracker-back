## Why

El módulo Relaciones solo permite mantener una lista mínima de personas, círculos y cumpleaños, por lo que no sirve todavía como memoria práctica de cada relación. Se necesita reunir los datos de contacto, los acontecimientos relevantes, los cumpleaños y las acciones pendientes de una persona sin duplicarlos ni perder su contexto.

## What Changes

- Ampliar Relaciones con una lista consultable de personas que permita administrar datos personales, múltiples medios de contacto, círculos, etiquetas, cumpleaños y preferencias de seguimiento.
- Incorporar una página individual por relación con resumen, cronología y pendientes asociados.
- Permitir registrar acontecimientos pasados o futuros con fecha exacta, mes, año o intervalo, incluyendo acontecimientos sensibles ocultos de las superficies globales por defecto.
- Integrar recordatorios y tareas con las relaciones, diferenciando claramente un acontecimiento sobre una persona de una acción que debe realizar el usuario.
- Añadir una vista global de acontecimientos y una vista de cumpleaños próximos y por mes, con cálculo de edad cuando se conozca el año de nacimiento.
- Mantener “Relaciones” como nombre del módulo y aprovechar la asociación polimórfica de tareas existente.
- Corregir la persistencia de acontecimientos de relaciones, actualmente inconsistente entre el modelo `RelationshipEvent` y la tabla `events`.
- Excluir de este alcance la importación o sincronización de contactos externos, las notificaciones push y las sugerencias automáticas basadas en inteligencia artificial.

## Capabilities

### New Capabilities

- `relationship-contacts`: Gestión de perfiles de relaciones, sus datos personales, medios de contacto, círculos, etiquetas, búsqueda, filtrado y archivo.
- `relationship-timeline`: Registro y consulta de acontecimientos con fechas de distinta precisión, intervalos, categorías y protección de información sensible.
- `relationship-reminders`: Creación y consulta de tareas o recordatorios contextualizados y asociados a una relación.
- `relationship-birthdays`: Consulta de cumpleaños próximos y por mes, incluyendo recurrencia anual y edad cuando exista el año de nacimiento.

### Modified Capabilities

Ninguna; no existen especificaciones principales previas para este módulo.

## Impact

- Afecta los modelos, migraciones y relaciones Eloquent de `Relationship`, `RelationshipEvent`, `Circle`, `Task` y `TaskAssociation`.
- Amplía las rutas y componentes Livewire del módulo Relaciones con una página de detalle y vistas separadas para acontecimientos y cumpleaños.
- Requiere cambios en `config/modules.php`, vistas Blade y estilos Material Design 3 del módulo.
- Requiere migraciones compatibles con los registros existentes de relaciones, cumpleaños y asociaciones con tareas.
- Añade pruebas de aislamiento por usuario, validación de fechas parciales, privacidad de acontecimientos, cumpleaños y sincronización de tareas asociadas.
