## Context

`MoodEntry` registra actualmente una emoción o estado con fecha, hora, valor y `MoodState`; Inicio, Ánimo y el rail del Diario crean entradas con un toque. Las estadísticas consumen el valor histórico y la API de Obsidian importa el mismo registro mínimo. No existen intensidad, situación, reflexión ni relación con personas.

El cambio `expand-relationship-management` define una página individual de relación y debe implementarse antes de integrar allí el contexto emocional. Este cambio no debe alterar la rapidez ni el contrato de las superficies existentes. Véanse `proposal.md` y las especificaciones para el comportamiento esperado.

## Goals / Non-Goals

**Goals:**

- Mantener el camino mínimo como una escritura inmediata de un solo toque.
- Compartir la misma experiencia posterior al guardado entre Inicio, Ánimo y Diario.
- Separar datos breves de una reflexión estructurada y potencialmente extensa.
- Hacer que cada paso sea recuperable y seguro ante cierres o navegación.
- Presentar asociaciones emocionales como observaciones del usuario, no evaluaciones de otras personas.

**Non-Goals:**

- Proporcionar psicoterapia, evaluación de riesgo o atención de crisis.
- Usar un modelo generativo, clasificar distorsiones o interpretar texto libre.
- Exigir una secuencia TCC clínicamente estandarizada o reemplazar formatos indicados por un profesional.
- Calcular compatibilidad, salud o calidad de una relación.

## Decisions

### Conservar MoodEntry como registro mínimo

Se añadirán a `mood_entries` únicamente `intensity` nullable y `situation` nullable. La emoción principal continúa representada por `mood_state_id` y su snapshot de emoji, texto y valor, preservando estadísticas e importaciones.

Los nuevos campos son nullable y no se cambian los parámetros obligatorios de la API. Las entradas existentes son válidas sin backfill inventado.

Alternativa considerada: reemplazar `MoodEntry` por un agregado nuevo de episodio emocional. Se descarta porque rompería los tres flujos rápidos, importaciones y estadísticas sin aportar valor al primer alcance.

### Priorizar emociones frecuentes sin alargar el selector

El selector compacto mostrará un conjunto limitado derivado de uso reciente y frecuencia, con acceso a “Más emociones” para el catálogo completo. Se incorporarán de forma idempotente emociones matizadas faltantes para usuarios nuevos y existentes, sin sobrescribir estados personalizados ni duplicar textos.

La selección sigue guardando inmediatamente. No se abre un modal de contexto al tocar una emoción.

Alternativa considerada: mostrar todo el catálogo en el primer nivel. Se descarta porque el aumento de vocabulario haría más lenta la acción cotidiana.

### Usar una acción posterior compartida

Después de crear la entrada, las tres superficies emitirán un mismo evento de interfaz con el identificador de la entrada. Un snackbar no modal ofrecerá Deshacer y Añadir contexto. Añadir contexto abrirá una hoja compacta con una sola pregunta textual, una escala visual opcional y búsqueda opcional de relaciones.

Las sugerencias de relaciones provendrán de búsqueda explícita y contactos recientes; escribir un nombre puede filtrar candidatos, pero nunca crea un vínculo sin confirmación.

Alternativa considerada: solicitar contexto antes de guardar. Se descarta porque convierte campos opcionales en fricción percibida y aumenta la probabilidad de abandonar el registro completo.

### Persistir reflexiones en una entidad uno-a-uno

`mood_reflections` tendrá una relación única con `mood_entries` y almacenará estado `draft` o `completed`, paso actual, pensamiento automático, evidencia a favor, evidencia que no encaja, perspectiva equilibrada, intensidad posterior y próximo paso. La situación e intensidad inicial permanecen en la entrada para poder usarlas sin iniciar una reflexión.

Cada avance guarda el campo actual y el identificador del siguiente paso. Los pasos vacíos se representan como null; el sistema no genera contenido. Eliminar la entrada elimina la reflexión, mientras reiniciar una reflexión solo elimina o vacía la entidad hija.

Alternativa considerada: añadir todas las columnas a `mood_entries`. Se descarta para mantener liviana la entidad consultada frecuentemente por Dashboard, Diario y Estadísticas.

### Implementar el asistente como máquina de estados determinista

El asistente será un flujo Livewire de una pregunta principal por pantalla. La secuencia queda definida en código y cada estado conoce su campo, texto, ayuda y siguiente paso. Omitir y continuar convergen en el mismo avance; Terminar por ahora persiste el borrador y cierra la experiencia.

No habrá análisis semántico, clasificación automática ni respuestas generadas. Una pantalla informativa accesible explicará los límites de autoobservación y que la herramienta no sustituye atención profesional o de emergencia.

Alternativa considerada: un formulario acordeón con todas las preguntas. Se descarta porque visualiza trabajo pendiente, aumenta la carga cognitiva y contradice el requisito de una pregunta por vez.

### Vincular relaciones mediante un pivote con propietario

Una tabla pivote `mood_entry_relationship` incluirá `user_id`, `mood_entry_id` y `relationship_id`, con unicidad y claves compuestas que garanticen el mismo propietario. Permitirá cero o varias personas sin duplicar la entrada.

Eliminar una relación elimina sus pivotes y conserva las entradas. En el detalle de la relación, las entradas vinculadas se consultan directamente y las reflexiones se cargan solo al expandirlas. No se crean registros `RelationshipEvent`.

Alternativa considerada: guardar un único `relationship_id` en `mood_entries`. Se descarta porque una interacción puede involucrar varias personas y la columna acoplaría el registro emocional al módulo Relaciones.

### Limitar los patrones a agregaciones descriptivas

Los resúmenes por relación usarán conteos, distribución de intensidad y comparación antes/después dentro de un periodo explícito. Cada resultado mostrará su número de registros. El texto se construirá a partir de plantillas neutrales y no inferirá causalidad.

No se calculará una puntuación global. Las respuestas textuales de TCC no se clasificarán ni analizarán automáticamente.

## Risks / Trade-offs

- [La confirmación posterior puede pasar inadvertida] → Mantenerla visible el tiempo suficiente, permitir enriquecer cualquier entrada desde el historial y no depender de ella para recuperar el flujo.
- [Un catálogo emocional más amplio puede volver lento el selector] → Limitar el primer nivel a recientes o frecuentes y mantener búsqueda secundaria.
- [Los usuarios pueden interpretar el asistente como terapia] → Usar lenguaje de autoobservación, explicar límites y evitar diagnósticos, etiquetas y recomendaciones clínicas.
- [El texto de reflexión es especialmente sensible] → Aislar por propietario, contraer detalles en Relaciones y excluirlos de widgets y acontecimientos globales.
- [Asociaciones pequeñas pueden parecer patrones sólidos] → Mostrar siempre periodo y tamaño de muestra, y emplear descripciones literales.
- [La dependencia con Relaciones puede bloquear parte de la interfaz] → Implementar primero persistencia y flujo emocional; habilitar la vista por persona después de `expand-relationship-management`.

## Migration Plan

1. Añadir campos emocionales nullable y crear `mood_reflections` sin modificar registros existentes.
2. Crear el pivote de relaciones únicamente después de que la estructura requerida por `expand-relationship-management` esté disponible.
3. Incorporar emociones matizadas faltantes de forma idempotente para cada usuario, preservando estados personalizados.
4. Desplegar el registro rápido y confirmar compatibilidad de Inicio, Ánimo, Diario, Estadísticas y API.
5. Habilitar contexto, asistente y finalmente la integración visual con Relaciones.

El rollback elimina reflexión, pivote y campos nuevos sin afectar las columnas históricas de `mood_entries`. La retirada del catálogo añadido no debe borrar estados que ya tengan entradas asociadas.
