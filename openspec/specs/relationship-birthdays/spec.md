# relationship-birthdays Specification

## Purpose

Ayudar al usuario a anticipar y consultar los cumpleaños de sus relaciones sin duplicar acontecimientos cada año.

## Requirements

### Requirement: Registrar cumpleaños completos o parciales
El sistema SHALL permitir guardar el cumpleaños de una relación con día y mes obligatorios para este dato y año opcional, validando que la combinación forme una fecha posible.

#### Scenario: Cumpleaños sin año
- **WHEN** el usuario registra día y mes sin año de nacimiento
- **THEN** el sistema conserva el cumpleaños recurrente sin mostrar ni calcular una edad

#### Scenario: Fecha inválida
- **WHEN** el usuario intenta registrar una combinación inexistente de día y mes
- **THEN** el sistema rechaza el dato con un error de validación

### Requirement: Mostrar próximos cumpleaños
El sistema SHALL proporcionar una vista de cumpleaños próximos dentro de los siguientes doce meses, ordenada por la próxima ocurrencia y capaz de cruzar el cambio de año.

#### Scenario: Próximo cumpleaños en enero
- **WHEN** el usuario consulta en diciembre y existe un cumpleaños en enero
- **THEN** el sistema lo incluye en la posición cronológica correspondiente del siguiente año

#### Scenario: Cumpleaños de hoy
- **WHEN** una relación cumple años en la fecha actual
- **THEN** el sistema la identifica como “Hoy”

### Requirement: Consultar cumpleaños por mes
El sistema SHALL permitir seleccionar un mes y mostrar las relaciones activas que cumplen años en él, ordenadas por día.

#### Scenario: Filtrar noviembre
- **WHEN** el usuario selecciona noviembre
- **THEN** el sistema muestra únicamente cumpleaños de noviembre ordenados por día

### Requirement: Calcular la edad cuando sea conocida
El sistema SHALL mostrar la edad que cumplirá la persona en la próxima ocurrencia únicamente cuando exista un año de nacimiento válido.

#### Scenario: Edad conocida
- **WHEN** una relación tiene fecha de nacimiento completa
- **THEN** la vista muestra la edad que cumplirá en su próximo cumpleaños

### Requirement: Resolver cumpleaños del 29 de febrero
El sistema SHALL considerar el 29 de febrero como fecha válida y, en años no bisiestos, SHALL presentar su celebración anual el 28 de febrero para efectos de ordenamiento y recordatorio sin modificar la fecha almacenada.

#### Scenario: Próxima ocurrencia en año no bisiesto
- **WHEN** una relación nació el 29 de febrero y el próximo año no es bisiesto
- **THEN** el sistema ordena y presenta su próximo cumpleaños el 28 de febrero conservando el 29 de febrero como cumpleaños registrado

### Requirement: No duplicar cumpleaños como acontecimientos
El sistema SHALL calcular las ocurrencias anuales desde los datos del perfil y MUST NOT crear automáticamente acontecimientos persistentes por cada año.

#### Scenario: Cambiar de año
- **WHEN** comienza un nuevo año
- **THEN** los próximos cumpleaños se recalculan sin insertar nuevos acontecimientos

### Requirement: Crear una tarea desde un cumpleaños
El sistema SHALL permitir iniciar una tarea asociada a la relación desde la vista de cumpleaños.

#### Scenario: Preparar un regalo
- **WHEN** el usuario elige crear una tarea desde un cumpleaños próximo
- **THEN** el sistema abre o crea una tarea asociada a esa relación con la fecha elegida por el usuario
