## Why

El registro actual de ánimo es rápido, pero no permite comprender qué ocurrió, con quién ni cómo evolucionó la emoción. La oportunidad es añadir contexto y reflexión guiada para desarrollar conciencia emocional sin convertir el registro cotidiano en un formulario largo u obligatorio.

## What Changes

- Conservar el registro inmediato de una emoción principal con un solo toque desde Ánimo, Inicio y Diario.
- Mantener compacto el selector priorizando emociones frecuentes o recientes y ofreciendo acceso secundario a un vocabulario más matizado, incluyendo emociones como preocupación, gratitud y alivio.
- Ofrecer después del guardado acciones no bloqueantes para deshacer, añadir contexto o iniciar una reflexión.
- Permitir añadir opcionalmente intensidad, una frase sobre lo ocurrido y cero o más relaciones vinculadas.
- Incorporar un asistente guiado de reflexión inspirado en registros de pensamientos de TCC, presentando una pregunta por vez, permitiendo omitir, cerrar y continuar posteriormente.
- Separar la captura rápida de la reflexión profunda para que ningún campo contextual sea obligatorio al registrar una emoción.
- Mostrar las experiencias emocionales vinculadas dentro del detalle deliberadamente abierto de cada relación, sin duplicarlas como acontecimientos ni atribuir causalidad a la persona.
- Añadir patrones descriptivos sobre emociones, intensidad y reflexiones, evitando puntajes de relación, diagnósticos o recomendaciones clínicas.
- Mantener compatibles los registros existentes y las entradas importadas desde Obsidian, que podrán continuar sin contexto ni reflexión.
- Excluir de esta primera versión la selección de múltiples emociones por registro, la generación mediante IA, el diagnóstico, la detección de distorsiones y la sustitución de acompañamiento profesional.

## Capabilities

### New Capabilities

- `progressive-emotion-logging`: Registro inmediato de una emoción principal y enriquecimiento opcional posterior con intensidad, situación y relaciones.
- `guided-emotional-reflection`: Asistente determinista, progresivo y reanudable para explorar situación, pensamiento, evidencia, perspectiva equilibrada y próximo paso.
- `relationship-emotional-context`: Consulta de experiencias emocionales vinculadas y patrones descriptivos dentro del contexto de una relación.

### Modified Capabilities

Ninguna; no existen especificaciones principales archivadas para Ánimo o Relaciones.

## Impact

- Afecta `MoodEntry`, `MoodState`, sus migraciones y los flujos de registro en Ánimo, Inicio y Diario.
- Añade persistencia separada para reflexiones y una asociación de propietario consistente entre entradas emocionales y relaciones.
- Amplía la página individual definida por el cambio `expand-relationship-management`; por tanto, la integración visual con Relaciones depende de que ese cambio esté implementado.
- Requiere componentes Livewire para contexto posterior al guardado, asistente paso a paso, borradores y consulta de patrones.
- Debe conservar la API de importación de estados de ánimo y las estadísticas históricas basadas en `value`.
- Requiere pruebas de baja fricción, reanudación, privacidad, aislamiento por usuario, compatibilidad de importación y lenguaje no causal.
