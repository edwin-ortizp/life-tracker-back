## Context

`mood_states` pertenece a cada usuario y actualmente guarda emoji, texto, valor y categoría. Los usuarios nuevos reciben el catálogo desde `DefaultMoodStates`, pero la base local contiene usuarios existentes sin estados y la migración de vocabulario pendiente solo contempla el subconjunto matizado. No existe ruta o componente de ajustes; los selectores dependen de que haya registros disponibles.

`MoodEntry` conserva snapshots de emoji, texto y valor, y la clave foránea a `mood_states` restringe la eliminación de estados utilizados. El registro progresivo y sus tres superficies ya están definidos por la spec principal existente. Véase `proposal.md` para la motivación y `specs/emotion-settings/spec.md` para el contrato.

## Goals / Non-Goals

**Goals:**

- Proporcionar una recuperación determinista para cuentas nuevas y existentes.
- Permitir personalización sin sacrificar integridad histórica.
- Mantener el selector compacto controlando activación, fijación y orden.
- Hacer explícita la diferencia entre valencia del catálogo e intensidad episódica.
- Respetar una decisión deliberada de desactivar todas las emociones.

**Non-Goals:**

- Compartir catálogos entre usuarios o mantener un catálogo global mutable.
- Inferir automáticamente emociones desde texto o alterar reflexiones existentes.
- Recalcular snapshots o estadísticas históricas después de editar una emoción.
- Administrar categorías dinámicas en esta primera versión.

## Decisions

### Extender MoodState con identidad y estado de presentación

Se añadirán `default_key` nullable, `is_active` con valor inicial true, `is_pinned` con valor inicial false y `sort_order` con valor inicial cero. `default_key` será único por usuario cuando exista; los estados personalizados conservarán null.

La clave estable permite reconocer una predeterminada aunque el usuario cambie nombre, emoji o valencia. Los selectores aplicarán primero `is_active`, después estados fijados por `sort_order` y finalmente la priorización reciente o frecuente ya existente.

Alternativa considerada: identificar predeterminadas exclusivamente por texto. Se descarta porque renombrar una emoción haría que Restaurar catálogo creara duplicados.

### Reparar mediante una migración nueva e idempotente

Se creará una migración correctiva posterior a las migraciones emocionales existentes. Para cada usuario, asociará claves a predeterminadas reconocibles y creará todas las predeterminadas ausentes usando `DefaultMoodStates::all()`, no únicamente `nuanced()`.

No se reescribirá una migración que puede haberse ejecutado en otros entornos. La operación compartirá un servicio de restauración con el registro de cuentas nuevas y la acción manual, de forma que las tres rutas tengan la misma semántica idempotente.

Alternativa considerada: ejecutar `createFor` durante cada visita al módulo. Se descarta porque reactivaría o recrearía emociones que el usuario decidió desactivar.

### Separar restauración de restablecimiento

“Restaurar catálogo predeterminado” crea faltantes y reactiva predeterminadas existentes, pero conserva campos visibles editados y estados personalizados. No es un reset destructivo. La acción requiere confirmación y devuelve un resumen de emociones creadas o reactivadas.

Alternativa considerada: reemplazar todo el catálogo por los valores originales. Se descarta porque eliminaría personalizaciones y podría afectar flujos externos que usan identificadores existentes.

### Usar desactivación como camino seguro

Los estados predeterminados nunca se borrarán desde la interfaz. Un estado personalizado solo podrá eliminarse si no tiene `MoodEntry`; en caso contrario, la interfaz ofrece desactivación. La restricción de base de datos permanece como última defensa.

Editar un estado no actualiza snapshots existentes. Esto conserva el significado visual e histórico del registro en el momento en que fue creado.

Alternativa considerada: permitir borrado en cascada de entradas. Se descarta porque una preferencia de catálogo no debe destruir el historial emocional.

### Añadir una página de ajustes dedicada

El módulo Ánimo tendrá tabs Registro diario y Ajustes. La página de ajustes utilizará búsqueda y filtros M3 por categoría y estado, lista ordenable, acciones de activar, fijar, editar y eliminar, y diálogo para crear o editar.

El formulario presentará `value` como valencia con extremos desagradable y agradable; intensidad seguirá perteneciendo a cada `MoodEntry`. Las categorías iniciales continuarán siendo Emocional, Mental y Físico para mantener compatibilidad.

Alternativa considerada: administrar el catálogo dentro del diálogo “Más emociones”. Se descarta porque mezcla selección rápida con tareas de configuración y hace menos visible la recuperación del catálogo vacío.

### Proporcionar un estado vacío compartido

`MoodLogger` expondrá si existen estados activos. MoodTracker, Dashboard y JournalMoodRail renderizarán un componente compartido con Restaurar catálogo y un enlace a Ajustes cuando el conjunto sea vacío. No se restaurará automáticamente: un catálogo completamente inactivo puede ser una decisión válida.

La API que lista estados devolverá únicamente estados activos para nuevos registros; las entradas históricas e importadas previamente continúan legibles por snapshot.

## Risks / Trade-offs

- [La base ya puede contener estados con nombres coincidentes pero semántica distinta] → Asignar claves solo a coincidencias inequívocas y nunca sobrescribir campos visibles durante la migración.
- [Fijar demasiadas emociones puede desbordar el selector compacto] → Respetar el límite existente, ordenar fijadas primero y mantener el resto accesible en el catálogo completo.
- [El usuario puede confundir valor con intensidad] → Etiquetar como valencia, explicar ambos extremos y enlazar una ayuda breve.
- [Restaurar puede sorprender si reactiva estados desactivados] → Solicitar confirmación y resumir exactamente qué se creará o reactivará.
- [Un rollback puede dejar estados creados sin claves] → Conservar las filas para proteger referencias y retirar solo columnas y UI nuevas.

## Migration Plan

1. Añadir columnas de identidad, activación, fijación y orden con valores compatibles para todas las filas actuales.
2. Actualizar `DefaultMoodStates` con claves estables y un servicio idempotente de creación o restauración.
3. Ejecutar una migración correctiva que procese todos los usuarios y complete el catálogo base y matizado.
4. Desplegar modelos, scopes y API compatibles con estados activos.
5. Habilitar la página Ajustes y los estados vacíos compartidos.
6. Verificar que los dos usuarios actuales pasen de catálogo vacío a catálogo completo sin crear `MoodEntry`.

El rollback no eliminará emociones creadas durante la reparación, porque podrían haber sido utilizadas después. Retirará las columnas nuevas y la interfaz de configuración conservando el catálogo y los snapshots históricos.
