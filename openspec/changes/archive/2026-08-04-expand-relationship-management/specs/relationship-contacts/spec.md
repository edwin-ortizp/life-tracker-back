## Purpose

Permitir que cada usuario mantenga perfiles completos y consultables de las personas que forman parte de sus relaciones personales.

## ADDED Requirements

### Requirement: Administrar perfiles de relaciones
El sistema SHALL permitir crear y editar una relación con nombre completo obligatorio y con apodo, foto, pronombres, ocupación, organización, dirección y notas generales opcionales.

#### Scenario: Crear un perfil mínimo
- **WHEN** el usuario guarda una relación indicando únicamente un nombre completo válido
- **THEN** el sistema crea el perfil y lo muestra en la lista de Relaciones

#### Scenario: Editar datos personales
- **WHEN** el usuario modifica los datos opcionales de una relación existente y guarda el formulario
- **THEN** el sistema conserva los nuevos valores y los muestra en el detalle de esa relación

### Requirement: Administrar medios de contacto
El sistema SHALL permitir registrar cero o más teléfonos, correos electrónicos, perfiles sociales u otros medios de contacto por relación, cada uno con etiqueta y opción de medio principal.

#### Scenario: Registrar varios medios
- **WHEN** el usuario agrega un teléfono personal y un correo laboral a una relación
- **THEN** ambos medios quedan asociados al perfil con su tipo y etiqueta correspondientes

#### Scenario: Designar un medio principal
- **WHEN** el usuario marca un medio como principal dentro de su tipo
- **THEN** el sistema desmarca cualquier otro medio principal del mismo tipo para esa relación

### Requirement: Organizar relaciones
El sistema SHALL permitir asignar una relación a un círculo principal y a cero o más etiquetas, y SHALL permitir administrar los círculos y etiquetas pertenecientes al usuario.

#### Scenario: Clasificar una relación
- **WHEN** el usuario asigna un círculo y varias etiquetas a una relación
- **THEN** el sistema muestra esas clasificaciones en la lista y en el detalle

### Requirement: Consultar la lista de relaciones
El sistema SHALL ofrecer búsqueda por nombre, apodo y valor de medio de contacto, además de filtros por círculo, etiqueta y estado de archivo, conservando esos filtros en la URL.

#### Scenario: Buscar por teléfono o correo
- **WHEN** el usuario introduce parte de un teléfono o correo registrado
- **THEN** el sistema muestra las relaciones cuyo medio de contacto contiene el texto buscado

#### Scenario: Combinar filtros
- **WHEN** el usuario selecciona un círculo, una etiqueta y el estado activo
- **THEN** el sistema muestra únicamente las relaciones que cumplen todos los filtros seleccionados

### Requirement: Consultar el detalle de una relación
El sistema SHALL proporcionar una página individual con el resumen del perfil, su cronología y sus pendientes asociados.

#### Scenario: Abrir una relación
- **WHEN** el usuario selecciona una relación de la lista
- **THEN** el sistema abre su página individual mostrando únicamente información que pertenece a esa relación

### Requirement: Archivar relaciones sin perder contexto
El sistema SHALL permitir archivar y desarchivar relaciones conservando sus datos, acontecimientos y asociaciones con tareas.

#### Scenario: Archivar una relación
- **WHEN** el usuario archiva una relación activa
- **THEN** el sistema la excluye de la lista activa sin eliminar su perfil, acontecimientos ni asociaciones

### Requirement: Aislar datos por usuario
El sistema MUST impedir que un usuario consulte o modifique relaciones, círculos, etiquetas o medios de contacto pertenecientes a otro usuario.

#### Scenario: Acceder a una relación ajena
- **WHEN** un usuario intenta acceder mediante URL o acción de componente al identificador de una relación ajena
- **THEN** el sistema rechaza el acceso sin revelar sus datos
