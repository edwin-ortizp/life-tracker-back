## Purpose

Permitir observar experiencias emocionales vinculadas con una relación sin duplicar datos, puntuar personas ni presentar asociaciones como causas.

## ADDED Requirements

### Requirement: Mostrar entradas vinculadas en la relación
El sistema SHALL mostrar en el detalle de una relación sus entradas emocionales vinculadas, ordenadas cronológicamente y diferenciadas de los acontecimientos y las tareas.

#### Scenario: Consultar interacciones con Alison
- **WHEN** el usuario abre a Alison y existen entradas emocionales vinculadas
- **THEN** el sistema muestra emoción, fecha, intensidad cuando exista y contexto breve sin crear acontecimientos duplicados

### Requirement: Proteger el contenido de reflexión
El sistema SHALL mantener contraído por defecto el contenido detallado de una reflexión en la página de la relación y SHALL revelarlo únicamente mediante una acción explícita del propietario.

#### Scenario: Abrir el detalle de una relación
- **WHEN** el usuario entra a una relación con reflexiones vinculadas
- **THEN** el sistema no muestra automáticamente pensamientos, evidencias ni perspectivas equilibradas completas

### Requirement: Ofrecer patrones descriptivos
El sistema SHALL permitir consultar, para un periodo seleccionado, conteos por emoción, distribución de intensidad y cambios de intensidad de reflexiones vinculadas, indicando el número de registros del que proviene cada resumen.

#### Scenario: Consultar un patrón
- **WHEN** el usuario revisa el resumen emocional de una relación durante treinta días
- **THEN** el sistema describe los registros del periodo y muestra su tamaño de muestra

### Requirement: Evitar atribuciones y puntuaciones de personas
El sistema MUST NOT calcular un puntaje de calidad de la relación ni expresar que una persona causó una emoción; SHALL describir únicamente asociaciones presentes en los registros del usuario.

#### Scenario: Mostrar frustración recurrente
- **WHEN** existen varias entradas de frustración vinculadas con Alison
- **THEN** el sistema usa lenguaje equivalente a “Registraste frustración en interacciones vinculadas con Alison” y no “Alison te causa frustración”

### Requirement: Desvincular sin eliminar la experiencia
El sistema SHALL permitir retirar una relación de una entrada sin eliminar la entrada ni su reflexión, y SHALL conservar las entradas cuando una relación sea eliminada permanentemente.

#### Scenario: Eliminar una relación vinculada
- **WHEN** el usuario elimina permanentemente una relación
- **THEN** el sistema elimina las vinculaciones correspondientes y conserva las entradas emocionales y reflexiones del usuario

### Requirement: Excluir contexto emocional de superficies generales de relaciones
El sistema MUST NOT mostrar entradas emocionales ni reflexiones en la vista global de acontecimientos, widgets generales o tarjetas resumidas de Relaciones.

#### Scenario: Consultar acontecimientos globales
- **WHEN** una entrada emocional está vinculada con una relación
- **THEN** no aparece como acontecimiento en la cronología global de Relaciones

### Requirement: Aislar vínculos por usuario
El sistema MUST permitir consultar y administrar un vínculo emocional solo cuando la entrada y la relación pertenecen al mismo usuario.

#### Scenario: Consultar vínculos ajenos
- **WHEN** un usuario intenta consultar vínculos pertenecientes a otro propietario
- **THEN** el sistema rechaza el acceso sin revelar emociones ni relaciones
