# relationship-reminders Specification

## Purpose

Convertir el contexto de una relación en acciones concretas mediante tareas integradas con el módulo general de productividad.

## Requirements

### Requirement: Crear tareas desde una relación
El sistema SHALL permitir crear una tarea asociada desde el detalle de una relación, indicando como mínimo título y opcionalmente fecha, prioridad, privacidad y demás atributos soportados por las tareas.

#### Scenario: Crear un recordatorio contextualizado
- **WHEN** el usuario crea “Recordarle pedir cita médica” desde la relación de Alison
- **THEN** el sistema crea una única tarea visible en el detalle de Alison y en el módulo general de Tareas

### Requirement: Distinguir acontecimientos de acciones
El sistema SHALL presentar los acontecimientos como hechos de la cronología y las tareas como acciones pendientes o completadas, sin convertir automáticamente uno en otro.

#### Scenario: Registrar graduación sin tarea
- **WHEN** el usuario crea el acontecimiento “Graduación” y no solicita un recordatorio
- **THEN** el sistema no crea una tarea implícita

### Requirement: Reflejar el estado de la tarea asociada
El sistema SHALL mostrar en el detalle de la relación el estado, vencimiento y finalización actuales de cada tarea asociada.

#### Scenario: Completar desde Tareas
- **WHEN** el usuario completa en el módulo Tareas una tarea asociada a una relación
- **THEN** el detalle de la relación la muestra como completada sin crear una copia

### Requirement: Conservar tareas al eliminar una relación
El sistema SHALL eliminar la asociación al borrar permanentemente una relación, pero SHALL conservar la tarea general y su estado.

#### Scenario: Eliminar una relación con tareas
- **WHEN** el usuario elimina permanentemente una relación que tiene tareas asociadas
- **THEN** el sistema conserva las tareas y elimina únicamente sus asociaciones con la relación

### Requirement: Sugerir seguimiento sin crear ruido
El sistema SHALL señalar las relaciones cuyo seguimiento está vencido según su frecuencia configurada y SHALL permitir crear una tarea desde la sugerencia, pero MUST NOT crear tareas automáticamente.

#### Scenario: Frecuencia de contacto vencida
- **WHEN** ha transcurrido la frecuencia configurada desde el último contacto de una relación
- **THEN** el sistema la identifica como pendiente de contacto y ofrece crear una tarea

#### Scenario: Marcar contacto reciente
- **WHEN** el usuario registra que contactó a la persona
- **THEN** el sistema actualiza la fecha de último contacto y recalcula la siguiente sugerencia

### Requirement: Aislar asociaciones por usuario
El sistema MUST asociar una tarea a una relación únicamente cuando ambas pertenecen al mismo usuario.

#### Scenario: Asociar recursos de propietarios distintos
- **WHEN** se intenta asociar una tarea y una relación pertenecientes a usuarios diferentes
- **THEN** el sistema rechaza la asociación
