## Purpose

Conservar una cronología útil de acontecimientos pasados y futuros de cada relación, incluyendo fechas imprecisas y contenido sensible.

## ADDED Requirements

### Requirement: Administrar acontecimientos de una relación
El sistema SHALL permitir crear, editar, archivar y eliminar acontecimientos asociados a una relación con título, categoría, fecha y notas opcionales.

#### Scenario: Registrar un acontecimiento futuro
- **WHEN** el usuario registra “Graduación” para una relación con una fecha futura
- **THEN** el sistema lo muestra como acontecimiento próximo tanto en la cronología de la relación como en la vista global de acontecimientos

#### Scenario: Registrar un acontecimiento pasado
- **WHEN** el usuario registra un acontecimiento con una fecha pasada
- **THEN** el sistema lo ubica cronológicamente en el historial de la relación

### Requirement: Admitir distintas precisiones de fecha
El sistema SHALL admitir fechas de acontecimiento con precisión de día, mes, año o intervalo, SHALL exigir un año para las precisiones de mes y año, y SHALL presentar únicamente la precisión proporcionada por el usuario.

#### Scenario: Registrar solo un mes
- **WHEN** el usuario registra una graduación para noviembre de 2026 sin indicar día
- **THEN** el sistema guarda la precisión mensual y muestra “noviembre de 2026” sin inventar un día

#### Scenario: Registrar un intervalo
- **WHEN** el usuario registra un viaje con fechas inicial y final válidas
- **THEN** el sistema muestra el intervalo y lo ordena por su fecha inicial

#### Scenario: Rechazar un intervalo invertido
- **WHEN** el usuario intenta guardar un intervalo cuya fecha final es anterior a la inicial
- **THEN** el sistema rechaza el formulario con un error de validación

### Requirement: Clasificar acontecimientos
El sistema SHALL ofrecer categorías iniciales para hitos personales, educación o trabajo, salud, familia, viajes, conversaciones, celebraciones y otros, manteniendo un título libre.

#### Scenario: Filtrar por categoría
- **WHEN** el usuario filtra la vista global por la categoría Salud
- **THEN** el sistema muestra solo los acontecimientos de Salud que el usuario está autorizado a ver en esa superficie

### Requirement: Proteger acontecimientos sensibles
El sistema SHALL permitir marcar un acontecimiento como sensible y SHALL excluir los acontecimientos sensibles de resúmenes, widgets y vistas globales por defecto, aunque SHALL mostrarlos dentro del detalle de la relación al usuario propietario.

#### Scenario: Crear un acontecimiento sensible
- **WHEN** el usuario registra un acontecimiento de salud como sensible
- **THEN** el acontecimiento aparece en la cronología privada de la relación y no aparece en las superficies globales predeterminadas

#### Scenario: Incluir sensibles explícitamente
- **WHEN** el usuario propietario activa el filtro explícito para incluir acontecimientos sensibles en la vista global
- **THEN** el sistema los muestra durante esa consulta sin cambiar el comportamiento predeterminado

### Requirement: Consultar acontecimientos globalmente
El sistema SHALL proporcionar una vista de acontecimientos pasados y próximos con búsqueda y filtros por relación, categoría, periodo, estado de archivo e inclusión de sensibles, conservando los filtros en la URL.

#### Scenario: Consultar próximos acontecimientos
- **WHEN** el usuario selecciona el periodo de próximos acontecimientos
- **THEN** el sistema devuelve los acontecimientos no archivados cuya ventana temporal aún no ha finalizado, ordenados por proximidad

### Requirement: Aislar acontecimientos por usuario
El sistema MUST impedir la consulta o modificación de acontecimientos asociados a relaciones de otro usuario.

#### Scenario: Manipular un acontecimiento ajeno
- **WHEN** un usuario envía el identificador de un acontecimiento perteneciente a otro usuario
- **THEN** el sistema rechaza la operación sin alterar el acontecimiento
