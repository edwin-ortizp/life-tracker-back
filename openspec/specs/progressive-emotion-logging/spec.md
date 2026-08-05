# progressive-emotion-logging Specification

## Purpose

Mantener el registro emocional cotidiano inmediato y permitir enriquecerlo después, sin convertir datos opcionales en barreras de entrada.

## Requirements

### Requirement: Registrar una sola emoción inmediatamente
El sistema SHALL guardar una entrada emocional al seleccionar una emoción principal y MUST NOT exigir intensidad, situación, relación ni reflexión para completar ese guardado.

#### Scenario: Registro de un toque
- **WHEN** el usuario selecciona una emoción desde Ánimo, Inicio o Diario
- **THEN** el sistema guarda inmediatamente una entrada con esa única emoción y la fecha y hora correspondientes

#### Scenario: Guardar sin contexto
- **WHEN** el usuario no realiza ninguna acción después de seleccionar la emoción
- **THEN** la entrada permanece guardada válidamente sin campos contextuales

### Requirement: Mantener compacto el selector
El sistema SHALL priorizar en el selector las emociones recientes o frecuentes del usuario y SHALL mantener accesible el vocabulario completo mediante una acción secundaria, sin requerir búsquedas para las opciones priorizadas.

#### Scenario: Usar una emoción frecuente
- **WHEN** el usuario abre el selector y elige una emoción priorizada
- **THEN** puede registrarla con un toque sin abrir el catálogo completo

#### Scenario: Buscar una emoción matizada
- **WHEN** el usuario necesita una emoción no visible entre las priorizadas
- **THEN** puede abrir el catálogo y encontrar emociones como preocupación, gratitud o alivio

### Requirement: Ofrecer acciones posteriores no bloqueantes
Después de guardar, el sistema SHALL mostrar confirmación no modal con acciones para deshacer y añadir contexto, y SHALL permitir que el usuario continúe usando la página sin responder.

#### Scenario: Ignorar la confirmación
- **WHEN** el usuario registra una emoción y no interactúa con la confirmación
- **THEN** la confirmación desaparece sin abrir formularios ni alterar la entrada

#### Scenario: Deshacer el registro recién creado
- **WHEN** el usuario activa Deshacer desde la confirmación de una entrada recién creada
- **THEN** el sistema elimina únicamente esa entrada y sus datos dependientes

### Requirement: Añadir contexto breve opcional
El sistema SHALL permitir añadir o editar posteriormente una intensidad de 1 a 5, una frase sobre lo ocurrido y cero o más relaciones vinculadas, sin exigir que todos esos datos estén presentes.

#### Scenario: Guardar solo una situación
- **WHEN** el usuario escribe “Discutí con Alison” y no selecciona intensidad ni relación
- **THEN** el sistema guarda la frase sin inventar ni exigir los demás datos

#### Scenario: Vincular una relación sugerida
- **WHEN** el sistema sugiere a Alison a partir de la búsqueda o del texto y el usuario confirma la sugerencia
- **THEN** la entrada queda vinculada con Alison

#### Scenario: Ignorar una relación sugerida
- **WHEN** el sistema presenta una relación sugerida y el usuario no la confirma
- **THEN** el sistema no crea la vinculación automáticamente

### Requirement: Permitir edición posterior
El sistema SHALL permitir editar la emoción principal y sus campos contextuales desde el historial emocional, manteniendo como máximo una emoción principal.

#### Scenario: Corregir la emoción
- **WHEN** el usuario cambia una entrada de tristeza a preocupación
- **THEN** el sistema conserva el contexto existente y reemplaza la emoción principal

### Requirement: Conservar compatibilidad con entradas existentes e importadas
El sistema SHALL tratar como válidas las entradas históricas y las importadas sin intensidad, situación, relaciones ni reflexión, y SHALL conservar el contrato existente de importación.

#### Scenario: Importar desde Obsidian
- **WHEN** una integración crea una entrada con los campos admitidos actualmente
- **THEN** el sistema la guarda sin exigir los nuevos campos opcionales

### Requirement: Aislar datos emocionales por usuario
El sistema MUST impedir que un usuario consulte, modifique o vincule entradas emocionales, estados o relaciones pertenecientes a otro usuario.

#### Scenario: Vincular una relación ajena
- **WHEN** un usuario intenta vincular su entrada con una relación de otro propietario
- **THEN** el sistema rechaza la vinculación sin revelar datos de la relación
