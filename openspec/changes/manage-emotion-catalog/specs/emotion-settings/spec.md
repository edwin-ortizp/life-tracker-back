## Purpose

Permitir que cada usuario configure y recupere su catálogo personal de emociones, garantizando que el registro emocional nunca quede inutilizable por falta de opciones.

## ADDED Requirements

### Requirement: Acceder a la configuración de emociones
El sistema SHALL proporcionar un tab Ajustes dentro de Ánimo y energía que muestre las emociones activas e inactivas pertenecientes al usuario.

#### Scenario: Abrir ajustes
- **WHEN** el usuario selecciona el tab Ajustes del módulo
- **THEN** el sistema muestra su catálogo personal y acciones para administrarlo

### Requirement: Crear emociones personalizadas
El sistema SHALL permitir crear una emoción indicando emoji, nombre único para el usuario, categoría y valencia de 1 a 10.

#### Scenario: Crear una emoción válida
- **WHEN** el usuario guarda una emoción personalizada con todos los campos válidos
- **THEN** el sistema la añade activa a su catálogo y la deja disponible en los selectores

#### Scenario: Repetir un nombre
- **WHEN** el usuario intenta crear otra emoción con el mismo nombre dentro de su catálogo
- **THEN** el sistema rechaza el formulario con un error de validación

### Requirement: Explicar valencia e intensidad
La configuración SHALL presentar la valencia como qué tan agradable o desagradable resulta normalmente una emoción y MUST NOT describirla como intensidad, la cual se registra por episodio.

#### Scenario: Consultar ayuda de valencia
- **WHEN** el usuario configura el valor de una emoción
- **THEN** el sistema explica la diferencia entre valencia del catálogo e intensidad de un registro concreto

### Requirement: Editar emociones sin reescribir el historial
El sistema SHALL permitir editar emoji, nombre, categoría y valencia de una emoción, y MUST NOT modificar los snapshots de entradas emocionales ya registradas.

#### Scenario: Editar una emoción utilizada
- **WHEN** el usuario cambia el emoji o nombre de una emoción que ya tiene entradas
- **THEN** los selectores futuros usan los datos nuevos y las entradas históricas conservan sus datos originales

### Requirement: Activar y desactivar emociones
El sistema SHALL permitir desactivar y reactivar emociones, SHALL excluir las inactivas de los selectores de nuevos registros y SHALL conservarlas en entradas históricas.

#### Scenario: Desactivar una emoción utilizada
- **WHEN** el usuario desactiva una emoción con entradas existentes
- **THEN** deja de aparecer para nuevos registros y sus entradas históricas permanecen legibles

#### Scenario: Reactivar una emoción
- **WHEN** el usuario reactiva una emoción inactiva
- **THEN** vuelve a estar disponible para nuevos registros

### Requirement: Fijar prioridades del selector rápido
El sistema SHALL permitir fijar y ordenar emociones activas, y SHALL colocarlas antes de las opciones derivadas por frecuencia o uso reciente dentro de la capacidad disponible del selector compacto.

#### Scenario: Fijar una emoción
- **WHEN** el usuario fija Preocupación y la coloca primero
- **THEN** Preocupación ocupa la primera posición del selector rápido

#### Scenario: Desactivar una emoción fijada
- **WHEN** el usuario desactiva una emoción fijada
- **THEN** el sistema la excluye del selector rápido sin eliminar su preferencia histórica

### Requirement: Eliminar solo emociones personalizadas no utilizadas
El sistema SHALL permitir eliminar permanentemente una emoción personalizada únicamente cuando no tenga entradas asociadas; las emociones predeterminadas y las personalizadas utilizadas SHALL ofrecer desactivación en lugar de eliminación.

#### Scenario: Eliminar una emoción sin uso
- **WHEN** el usuario elimina una emoción personalizada que nunca fue utilizada
- **THEN** el sistema la elimina permanentemente de su catálogo

#### Scenario: Intentar eliminar una emoción utilizada
- **WHEN** el usuario intenta eliminar una emoción que tiene entradas asociadas
- **THEN** el sistema impide la eliminación y ofrece desactivarla

### Requirement: Inicializar el catálogo completo
El sistema SHALL incorporar a cada usuario nuevo o existente todas las emociones predeterminadas faltantes de forma idempotente, identificándolas mediante claves estables y sin sobrescribir emociones personalizadas ni crear entradas emocionales.

#### Scenario: Usuario existente sin emociones
- **WHEN** se ejecuta la inicialización para un usuario cuyo catálogo está vacío
- **THEN** el usuario recibe el catálogo predeterminado completo

#### Scenario: Repetir la inicialización
- **WHEN** la inicialización se ejecuta nuevamente para el mismo usuario
- **THEN** no duplica emociones ni altera personalizaciones existentes

### Requirement: Restaurar el catálogo predeterminado
El sistema SHALL ofrecer una acción explícita para recrear emociones predeterminadas faltantes y reactivar las predeterminadas inactivas, preservando emociones personalizadas y los datos visibles editados de predeterminadas existentes.

#### Scenario: Restaurar un catálogo vacío
- **WHEN** el usuario selecciona Restaurar catálogo predeterminado y confirma la acción
- **THEN** el sistema deja disponibles todas las emociones predeterminadas sin eliminar emociones personalizadas

#### Scenario: Restaurar después de editar
- **WHEN** el usuario restaura y una emoción predeterminada existente tiene emoji o nombre personalizado
- **THEN** el sistema conserva esa personalización y evita crear un duplicado

### Requirement: Recuperar superficies sin emociones activas
Cuando el usuario no tenga emociones activas, Ánimo, Inicio y Diario SHALL mostrar un estado vacío con acciones para restaurar el catálogo o abrir Ajustes, en lugar de un selector vacío.

#### Scenario: Abrir Ánimo sin emociones activas
- **WHEN** el usuario visita el módulo y todas sus emociones están inactivas o ausentes
- **THEN** el sistema explica cómo recuperarlas y ofrece las acciones Restaurar catálogo y Configurar emociones

### Requirement: Aislar el catálogo por usuario
El sistema MUST impedir que un usuario consulte o modifique emociones, estados de activación o prioridades pertenecientes a otro usuario.

#### Scenario: Editar una emoción ajena
- **WHEN** un usuario envía el identificador de una emoción perteneciente a otro usuario
- **THEN** el sistema rechaza la operación sin revelar sus datos
