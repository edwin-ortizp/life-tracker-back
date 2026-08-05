## 1. Persistencia y migración

- [x] 1.1 Añadir pruebas de migración que inventaríen relaciones, cumpleaños, acontecimientos y asociaciones existentes antes y después del cambio.
- [x] 1.2 Crear las migraciones de medios de contacto, etiquetas y pivote con UUID, propietario, claves foráneas compuestas e índices de búsqueda.
- [x] 1.3 Ampliar `relationships` con datos personales y frecuencia propia, y normalizar el año, mes y día de cumpleaños preservando los valores actuales.
- [x] 1.4 Renombrar `events` a `relationship_events` y migrar las fechas actuales a precisión exacta y ventanas `starts_on`/`ends_on`.
- [x] 1.5 Añadir categoría, notas, precisión de fecha, sensibilidad y archivo a los acontecimientos con valores predeterminados compatibles.
- [x] 1.6 Implementar y verificar los caminos de rollback sin pérdida de los datos históricos cubiertos por las pruebas.

## 2. Modelos y reglas de dominio

- [x] 2.1 Actualizar `Relationship` y crear modelos para medios de contacto y etiquetas con fillable, casts, relaciones y aislamiento por usuario.
- [x] 2.2 Actualizar `RelationshipEvent` para la tabla normalizada y añadir scopes de periodo, archivo y visibilidad sensible.
- [x] 2.3 Implementar un objeto o servicio de fecha de acontecimiento que valide, normalice, ordene y presente día, mes, año e intervalo sin mostrar precisión inventada.
- [x] 2.4 Implementar el cálculo de próxima ocurrencia y edad de cumpleaños, incluido el 29 de febrero en años no bisiestos.
- [x] 2.5 Implementar el cálculo de seguimiento vencido usando primero la frecuencia de la relación y después la del círculo.
- [x] 2.6 Ampliar factories y añadir pruebas unitarias de medios principales, fechas parciales, sensibles, cumpleaños y seguimiento.

## 3. Lista y perfil de Relaciones

- [x] 3.1 Actualizar la configuración del módulo y las rutas para los tabs Relaciones, Acontecimientos y Cumpleaños, más la página de detalle.
- [x] 3.2 Refactorizar la lista de Relaciones con búsqueda, paginación y filtros URL por círculo, etiqueta y archivo usando los patrones M3 prescritos.
- [x] 3.3 Ampliar el formulario de relación con datos personales, cumpleaños validado, círculo, etiquetas y medios de contacto repetibles.
- [x] 3.4 Crear la página individual de la relación con resumen, medios de contacto, cronología y pendientes cargados sin consultas N+1.
- [x] 3.5 Implementar administración de círculos y etiquetas y las acciones de archivar, desarchivar y eliminar con confirmación contextual.
- [x] 3.6 Añadir pruebas Livewire de CRUD, búsqueda por medios, filtros URL, archivo y acceso cruzado entre usuarios.

## 4. Cronología y acontecimientos

- [x] 4.1 Implementar el formulario de acontecimientos en el detalle con categorías, notas, precisión de fecha, intervalo y marca sensible.
- [x] 4.2 Renderizar la cronología de cada relación con acontecimientos pasados y futuros en su precisión original.
- [x] 4.3 Crear la vista global de acontecimientos con búsqueda y filtros URL por relación, categoría, periodo y archivo.
- [x] 4.4 Excluir sensibles de toda consulta global por defecto y añadir el control explícito para incluirlos solo durante la consulta actual.
- [x] 4.5 Implementar edición, archivo, desarchivo y eliminación de acontecimientos con autorización por propietario.
- [x] 4.6 Añadir pruebas Livewire de fechas exactas, mensuales, anuales e intervalos, ordenamiento, archivo y no exposición predeterminada de sensibles.

## 5. Pendientes y seguimiento

- [x] 5.1 Añadir al detalle el formulario de tarea asociada reutilizando `Task` y `TaskAssociation` sin crear un almacén paralelo de recordatorios.
- [x] 5.2 Mostrar pendientes y completadas con sus estados actuales y enlaces al módulo Tareas.
- [x] 5.3 Añadir indicadores de seguimiento vencido, acción para marcar contacto y acción explícita para crear una tarea sugerida.
- [x] 5.4 Garantizar que eliminar una relación borre sus asociaciones pero conserve las tareas generales.
- [x] 5.5 Añadir pruebas de creación única, actualización reflejada, conservación al eliminar y rechazo de asociaciones entre usuarios distintos.

## 6. Cumpleaños

- [x] 6.1 Crear la vista de cumpleaños próximos para doce meses con ordenamiento que cruce el año y etiquetas “Hoy” y tiempo restante.
- [x] 6.2 Añadir selector mensual y cálculo de edad únicamente cuando exista año de nacimiento.
- [x] 6.3 Añadir desde cada cumpleaños la acción para iniciar una tarea asociada con fecha elegida por el usuario.
- [x] 6.4 Añadir pruebas de cumpleaños sin año, fechas inválidas, cambio de año, 29 de febrero, edades y ausencia de acontecimientos duplicados.

## 7. Experiencia y verificación final

- [x] 7.1 Crear estilos responsivos del módulo con tokens M3 existentes y verificar navegación por teclado, etiquetas y estados de foco de formularios y diálogos.
- [x] 7.2 Incorporar al rail contextual estadísticas, próximo cumpleaños y seguimientos vencidos sin exponer acontecimientos sensibles.
- [x] 7.3 Ejecutar la suite focalizada del módulo, pruebas de asociaciones y estado URL, corrigiendo regresiones.
- [x] 7.4 Ejecutar la suite completa de PHP y el build de Vite, y documentar cualquier limitación de entorno que impida una verificación.
- [x] 7.5 Verificar los flujos de Alison: graduación mensual, acontecimiento sensible de salud, recordatorio de cita y cumpleaños.

### Notas de verificación

- 7.4: la suite completa pasa de 183 a 250 pruebas (67 nuevas, todas en verde) y el build de Vite compila sin errores.
  Persisten 21 fallos idénticos a los de `bccac3b` (baseline verificada en un worktree limpio), todos causados por
  `CURDATE()`/`NOW()` de MySQL en el `selectRaw` de `app/Livewire/Task/TaskList.php:482`, que SQLite no soporta.
  Ninguno pertenece a Relaciones y quedaron fuera del alcance de este cambio.
- 7.5: los cuatro flujos se recorren de extremo a extremo en `tests/Feature/RelationshipAlisonWalkthroughTest.php`,
  por decisión explícita del usuario de cubrirlos con pruebas automáticas en lugar del recorrido visual.
