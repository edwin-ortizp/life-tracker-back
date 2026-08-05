## 1. Esquema e inicialización

- [x] 1.1 Añadir pruebas de migración para un usuario sin emociones, uno con catálogo parcial y uno con estados personalizados o utilizados.
- [x] 1.2 Crear una migración que añada `default_key`, `is_active`, `is_pinned` y `sort_order` a `mood_states` con índices y valores compatibles.
- [x] 1.3 Añadir claves estables a todas las definiciones de `DefaultMoodStates` sin cambiar sus datos visibles actuales.
- [x] 1.4 Extraer un servicio idempotente que cree faltantes, asigne claves inequívocas y opcionalmente reactive predeterminadas.
- [x] 1.5 Crear una migración correctiva nueva que complete el catálogo base y matizado de todos los usuarios existentes mediante el servicio compartido.
- [x] 1.6 Actualizar el registro de usuarios para inicializar el catálogo completo mediante el mismo servicio.
- [x] 1.7 Verificar rollback conservador que retire columnas nuevas sin borrar emociones ni entradas históricas.

## 2. Dominio del catálogo

- [x] 2.1 Actualizar `MoodState` con fillable, casts, scopes activos y relaciones necesarias para conocer su uso histórico.
- [x] 2.2 Implementar validación de emoji, nombre único por usuario, categoría admitida y valencia entre 1 y 10.
- [x] 2.3 Implementar creación y edición sin modificar snapshots de `MoodEntry` existentes.
- [x] 2.4 Implementar activar, desactivar, fijar y ordenar emociones con prioridad consistente en el selector compacto.
- [x] 2.5 Implementar eliminación exclusiva de estados personalizados no utilizados y respuesta de desactivación para los demás casos.
- [x] 2.6 Implementar restauración confirmada que cree faltantes y reactive predeterminadas conservando personalizaciones visibles.
- [x] 2.7 Añadir pruebas unitarias de idempotencia, claves estables, edición histórica, activación, fijación, orden, eliminación segura y aislamiento por usuario.

## 3. Página de Ajustes

- [x] 3.1 Añadir rutas y tabs Registro diario y Ajustes al módulo Ánimo y energía, conservando el parámetro de fecha donde corresponda.
- [x] 3.2 Crear el componente Livewire de ajustes con búsqueda y filtros URL por categoría y estado activo.
- [x] 3.3 Crear la lista M3 de emociones con emoji, nombre, categoría, valencia, estado, prioridad y acciones disponibles.
- [x] 3.4 Crear el diálogo accesible de alta y edición con ayuda que diferencie valencia de intensidad.
- [x] 3.5 Añadir acciones de activar, desactivar, fijar, reordenar y eliminar con confirmaciones y mensajes contextuales.
- [x] 3.6 Añadir la acción Restaurar catálogo predeterminado con confirmación y resumen de creadas o reactivadas.
- [x] 3.7 Añadir pruebas Livewire de CRUD, filtros, validación, prioridades, restauración y rechazo de identificadores ajenos.

## 4. Selectores y estados vacíos

- [x] 4.1 Actualizar `MoodLogger` para consumir solo estados activos y priorizar fijadas por orden antes de recientes o frecuentes.
- [x] 4.2 Crear un componente compartido de catálogo vacío con Restaurar catálogo y enlace a Ajustes.
- [x] 4.3 Integrar el estado vacío en MoodTracker, Dashboard y JournalMoodRail sin restaurar datos automáticamente.
- [x] 4.4 Actualizar el endpoint de catálogo de la integración para listar únicamente emociones activas sin afectar entradas históricas.
- [x] 4.5 Añadir pruebas de selector compacto, exceso de fijadas, todas inactivas, recuperación desde las tres superficies y API.

## 5. Verificación final

- [x] 5.1 Aplicar estilos M3 responsivos y verificar teclado, foco, etiquetas, contraste y controles de orden.
- [x] 5.2 Ejecutar las pruebas de migración sobre una copia o fixture equivalente al estado local de dos usuarios y cero emociones.
- [x] 5.3 Ejecutar las suites focalizadas de Ánimo, Inicio, Diario, estadísticas, importación y configuración.
- [x] 5.4 Ejecutar la suite completa de PHP y el build de Vite, documentando cualquier regresión o limitación heredada.
- [ ] 5.5 Verificar manualmente crear una emoción, editarla, desactivarla, restaurar predeterminadas y registrar desde las tres superficies.
