## 1. Persistencia emocional compatible

- [x] 1.1 Añadir pruebas de migración que preserven entradas manuales e importadas, estados personalizados y estadísticas históricas.
- [x] 1.2 Crear una migración que añada `intensity` y `situation` nullable a `mood_entries` sin modificar registros existentes.
- [x] 1.3 Crear `mood_reflections` con vínculo único a la entrada, estado, paso actual y campos opcionales de reflexión, incluyendo eliminación en cascada.
- [x] 1.4 Actualizar `MoodEntry` y crear `MoodReflection` con casts, relaciones, validación de propietario y reglas de eliminación.
- [x] 1.5 Incorporar de forma idempotente emociones matizadas faltantes para usuarios nuevos y existentes sin duplicar ni sobrescribir estados personalizados.
- [x] 1.6 Añadir pruebas unitarias de intensidad, situación, emoción principal única, reflexión uno-a-uno y compatibilidad del catálogo.

## 2. Registro progresivo compartido

- [x] 2.1 Extraer un servicio o acción compartida de creación rápida usado por Ánimo, Inicio y Diario, conservando fecha, hora, snapshot y fuente actuales.
- [x] 2.2 Implementar el cálculo de emociones recientes o frecuentes y el acceso secundario al catálogo completo con búsqueda.
- [x] 2.3 Crear la confirmación no modal compartida con Deshacer y Añadir contexto, vinculada únicamente a la entrada recién creada.
- [x] 2.4 Crear la hoja compacta de contexto con una frase e intensidad opcionales, sin abrirla automáticamente ni exigir datos.
- [x] 2.5 Integrar el registro progresivo en `MoodTracker`, Dashboard y `JournalMoodRail` sin aumentar los pasos del camino mínimo.
- [x] 2.6 Permitir editar emoción, intensidad y situación desde el historial manteniendo una sola emoción principal.
- [x] 2.7 Añadir pruebas Livewire que demuestren guardado de un toque, confirmación no bloqueante, deshacer acotado y contexto totalmente opcional en las tres superficies.
- [x] 2.8 Ejecutar las pruebas de API de Obsidian y estadísticas para verificar que el contrato y los valores históricos no cambian.

## 3. Asistente guiado de reflexión

- [x] 3.1 Implementar la definición determinista de pasos para situación, pensamiento automático, ambas evidencias, perspectiva equilibrada, intensidad posterior y próximo paso.
- [x] 3.2 Crear el componente Livewire del asistente con una pregunta principal por pantalla y acciones Continuar, Omitir y Terminar por ahora.
- [x] 3.3 Autoguardar cada avance, estado y paso actual, y reanudar borradores desde el último paso pendiente.
- [x] 3.4 Implementar finalización y resumen sin inventar contenido para campos omitidos ni exigir reducción de intensidad.
- [x] 3.5 Añadir acciones para iniciar, reanudar y reiniciar una reflexión desde una entrada ya guardada.
- [x] 3.6 Añadir información accesible sobre el alcance de autoobservación y los límites frente a atención profesional o de emergencia.
- [x] 3.7 Añadir pruebas Livewire de secuencia, omisión, autoguardado, reanudación, finalización parcial, intensidad sin cambio y eliminación independiente.
- [x] 3.8 Añadir pruebas negativas que aseguren que el asistente no genera diagnósticos, causalidad, clasificaciones ni recomendaciones clínicas.

## 4. Asociación con Relaciones

- [x] 4.1 Verificar que las migraciones y la página de detalle de `expand-relationship-management` estén implementadas antes de iniciar la integración visual.
- [x] 4.2 Crear el pivote propietario entre entradas emocionales y relaciones con unicidad, claves compuestas y cascada solo sobre vínculos.
- [x] 4.3 Añadir relaciones Eloquent y operaciones de vincular y desvincular que validen que ambos recursos pertenecen al mismo usuario.
- [x] 4.4 Añadir búsqueda y relaciones recientes a la hoja de contexto, requiriendo confirmación explícita de cada vínculo sugerido.
- [x] 4.5 Mostrar las entradas emocionales vinculadas en el detalle de la relación, separadas de acontecimientos y tareas y con la reflexión contraída.
- [x] 4.6 Conservar entradas y reflexiones al eliminar una relación, retirando únicamente sus vínculos.
- [x] 4.7 Añadir pruebas de cero o varias relaciones, sugerencias no confirmadas, aislamiento cruzado, desvinculación y conservación al eliminar.

## 5. Patrones descriptivos

- [x] 5.1 Implementar consultas por relación y periodo para conteos de emociones, distribución de intensidad y comparación antes/después con tamaño de muestra.
- [x] 5.2 Crear la interfaz de patrones dentro del detalle de la relación usando plantillas neutrales y sin puntuación global.
- [x] 5.3 Excluir entradas y reflexiones de tarjetas, widgets y la vista global de acontecimientos de Relaciones.
- [x] 5.4 Añadir pruebas de periodos, tamaños de muestra, exclusión global y lenguaje descriptivo sin atribución causal.

## 6. Experiencia y verificación final

- [x] 6.1 Aplicar estilos M3 responsivos al snackbar, hoja de contexto, catálogo y asistente, con navegación por teclado, foco y etiquetas accesibles.
- [x] 6.2 Verificar que registrar una emoción priorizada continúe requiriendo un solo toque en Ánimo, Inicio y Diario.
- [x] 6.3 Verificar los flujos “Discutí con Alison”, “Mi papá me hizo un favor” y “Mi abuela se cayó”, con y sin reflexión.
- [x] 6.4 Ejecutar las suites focalizadas de Ánimo, Diario, Inicio, Relaciones, estadísticas, importación y aislamiento por usuario.
- [x] 6.5 Ejecutar la suite completa de PHP y el build de Vite, documentando cualquier limitación de entorno.

### Notas de verificación

- 6.2 y 6.3: los tres flujos y la garantía de un solo toque en las tres superficies se recorren de extremo a extremo
  en `tests/Feature/EmotionalWalkthroughTest.php`, siguiendo la misma decisión tomada en
  `expand-relationship-management` de cubrir el recorrido con pruebas automáticas en lugar de una sesión visual
  (el navegador exige iniciar sesión, algo que el agente no puede hacer).
- 6.5: la suite completa pasa de 250 a 326 pruebas (76 nuevas, todas en verde) y el build de Vite compila sin errores.
  Persisten los mismos 21 fallos heredados de `bccac3b`, todos por `CURDATE()`/`NOW()` de MySQL en el `selectRaw` de
  `app/Livewire/Task/TaskList.php:482`, que SQLite no soporta. Ninguno pertenece a Ánimo ni a Relaciones.
- Nota de compatibilidad: `MoodTracker`, `Dashboard` y `JournalMoodRail` pasaron de `where('date', ...)` a
  `whereDate('date', ...)` al leer entradas emocionales. El casteo `date` de Eloquent guarda `Y-m-d 00:00:00`,
  por lo que la comparación literal nunca coincidía en SQLite; el comportamiento en MySQL no cambia.
- Las cuatro migraciones se aplicaron sin errores sobre la base MySQL local además de la suite en SQLite.
