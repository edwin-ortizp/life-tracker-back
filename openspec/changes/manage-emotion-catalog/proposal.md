## Why

Los usuarios existentes pueden tener el catálogo de emociones vacío y el módulo no ofrece una pantalla para recuperarlo ni administrar estados propios, dejando inutilizables los registros rápidos. Se necesita una configuración accesible y una inicialización completa que no dependa exclusivamente del momento de registro de la cuenta.

## What Changes

- Añadir un tab Ajustes al módulo Ánimo y energía con una página dedicada al catálogo personal de emociones.
- Permitir crear y editar emociones con emoji, nombre, categoría y valencia, diferenciando esta última de la intensidad de una entrada emocional.
- Permitir activar o desactivar emociones y fijarlas para que tengan prioridad en el selector rápido.
- Permitir eliminar únicamente emociones personalizadas nunca utilizadas; las emociones referenciadas por entradas históricas se desactivan en lugar de borrarse.
- Incorporar claves estables para reconocer emociones predeterminadas aunque cambien sus datos visibles.
- Corregir la inicialización de usuarios existentes para incorporar el catálogo predeterminado completo de forma idempotente, sin sobrescribir personalizaciones ni inventar entradas emocionales.
- Ofrecer una acción Restaurar catálogo predeterminado que recree o reactive emociones predeterminadas faltantes sin eliminar emociones personalizadas.
- Mostrar estados vacíos recuperables en Ánimo, Inicio y Diario con acceso a restaurar o configurar emociones.
- Mantener aislados por usuario el catálogo, las acciones de configuración y las prioridades del selector.

## Capabilities

### New Capabilities

- `emotion-settings`: Configuración del catálogo personal de emociones, recuperación del catálogo predeterminado y comportamiento de las superficies de registro cuando no existen emociones activas.

### Modified Capabilities

Ninguna; el registro progresivo seguirá consumiendo las emociones activas disponibles sin cambiar su contrato de un toque.

## Impact

- Afecta `MoodState`, `DefaultMoodStates`, la migración de backfill pendiente y el flujo de creación de usuarios.
- Añade una ruta y componente Livewire de ajustes, un tab en `config/modules.php` y vistas Blade siguiendo los patrones M3.
- Requiere distinguir emociones predeterminadas, personalizadas, activas y fijadas sin romper el snapshot histórico de `MoodEntry`.
- Amplía los selectores de Ánimo, Inicio y Diario con un estado vacío accionable.
- Requiere pruebas de migración para los usuarios actuales sin emociones, CRUD, restauración idempotente, referencias históricas y aislamiento por usuario.
