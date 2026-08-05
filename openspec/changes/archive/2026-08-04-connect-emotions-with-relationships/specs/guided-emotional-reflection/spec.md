## Purpose

Ofrecer una reflexión estructurada y voluntaria inspirada en TCC mediante pasos breves, reanudables y claramente diferenciados de atención clínica.

## ADDED Requirements

### Requirement: Iniciar la reflexión desde una entrada guardada
El sistema SHALL permitir iniciar una reflexión únicamente como acción opcional sobre una entrada emocional existente y MUST NOT iniciarla automáticamente al registrar una emoción.

#### Scenario: Registrar sin reflexionar
- **WHEN** el usuario guarda una emoción y no selecciona Reflexionar
- **THEN** el sistema no crea ni abre una reflexión

#### Scenario: Iniciar posteriormente
- **WHEN** el usuario selecciona Reflexionar desde una entrada del historial
- **THEN** el sistema inicia o reanuda la reflexión asociada a esa entrada

### Requirement: Presentar una pregunta por vez
El asistente SHALL mostrar como máximo una pregunta principal editable por paso y SHALL ofrecer en cada paso las acciones Continuar, Omitir y Terminar por ahora.

#### Scenario: Avanzar en la reflexión
- **WHEN** el usuario responde la pregunta visible y selecciona Continuar
- **THEN** el sistema guarda la respuesta y presenta la siguiente pregunta

#### Scenario: Omitir una pregunta
- **WHEN** el usuario selecciona Omitir
- **THEN** el sistema avanza sin exigir una respuesta para ese paso

### Requirement: Guiar un registro de pensamientos
El asistente SHALL poder recorrer situación, pensamiento automático, evidencia que lo apoya, evidencia que no encaja, perspectiva equilibrada, intensidad posterior y próximo paso, conservando todos los campos como opcionales.

#### Scenario: Completar una reflexión
- **WHEN** el usuario llega al final y selecciona Finalizar reflexión
- **THEN** el sistema marca la reflexión como completada y muestra un resumen de las respuestas proporcionadas

#### Scenario: Finalizar con pasos omitidos
- **WHEN** el usuario completa el recorrido dejando respuestas vacías
- **THEN** el sistema conserva la reflexión sin inventar contenido para los pasos omitidos

### Requirement: Guardar y reanudar borradores
El sistema SHALL guardar cada respuesta al avanzar y SHALL permitir cerrar y reanudar una reflexión desde el último paso alcanzado.

#### Scenario: Terminar por ahora
- **WHEN** el usuario selecciona Terminar por ahora después de responder algunos pasos
- **THEN** el sistema conserva un borrador y devuelve al usuario al contexto anterior

#### Scenario: Reanudar borrador
- **WHEN** el usuario abre nuevamente una reflexión en borrador
- **THEN** el sistema presenta el último paso pendiente y conserva las respuestas anteriores

### Requirement: Comparar intensidad sin imponer un resultado
El sistema SHALL permitir registrar intensidad inicial y posterior en la misma escala de 1 a 5, y MUST NOT exigir que la intensidad disminuya para completar la reflexión.

#### Scenario: Intensidad sin cambio
- **WHEN** el usuario indica la misma intensidad antes y después
- **THEN** el sistema guarda ambos valores sin presentar el resultado como fracaso

### Requirement: Mantener límites no clínicos
El asistente MUST usar preguntas predeterminadas, MUST NOT diagnosticar, atribuir causalidad, clasificar pensamientos automáticamente ni generar conclusiones o recomendaciones clínicas, y SHALL mostrar una explicación accesible de estos límites.

#### Scenario: Consultar el alcance del asistente
- **WHEN** el usuario abre la información del asistente
- **THEN** el sistema explica que es una herramienta de autoobservación y no sustituye atención profesional o de emergencia

### Requirement: Eliminar reflexiones con su entrada
El sistema SHALL eliminar la reflexión asociada cuando se elimine su entrada emocional y MUST NOT eliminar la entrada al borrar solamente la reflexión.

#### Scenario: Reiniciar una reflexión
- **WHEN** el usuario elimina una reflexión existente
- **THEN** la entrada emocional y su contexto breve permanecen disponibles

### Requirement: Aislar reflexiones por usuario
El sistema MUST impedir que un usuario consulte o modifique una reflexión cuya entrada emocional pertenece a otro usuario.

#### Scenario: Acceder a una reflexión ajena
- **WHEN** un usuario intenta abrir el identificador de una reflexión ajena
- **THEN** el sistema rechaza el acceso sin revelar sus respuestas
