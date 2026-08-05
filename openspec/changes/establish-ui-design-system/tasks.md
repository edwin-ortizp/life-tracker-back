## 1. Inventario y contrato de conformidad

- [x] 1.1 Inventariar tokens, componentes, patrones repetidos, clases heredadas, colores directos y estilos inline de todas las vistas Blade, registrando archivo, regla y región afectada.
- [x] 1.2 Definir la configuración central de reglas, custom properties dinámicas admitidas y excepciones documentadas con motivo y alcance.
- [x] 1.3 Guardar el inventario inicial como baseline versionado de deuda visual y añadir una comprobación que impida aumentarlo.
- [x] 1.4 Añadir pruebas de arquitectura que reporten archivo y línea para patrones obsoletos, valores visuales directos y sustituciones de componentes canónicos.

## 2. Capas y tokens del sistema

- [x] 2.1 Completar los tokens semánticos de espacio, tipografía, forma, elevación, movimiento, breakpoints y z-index requeridos por las specs.
- [x] 2.2 Reorganizar los imports CSS en las capas tokens, primitives, patterns, archetypes y modules, preservando el prefijo `md-` y el resultado visual existente.
- [x] 2.3 Añadir una prueba que impida que estilos de módulo redefinan selectores base o dependan de capas posteriores.
- [x] 2.4 Documentar las variantes semánticas permitidas y el proceso para incorporar un token o variante nueva.

## 3. Primitivos canónicos

- [x] 3.1 Consolidar botones, icon buttons y enlaces de acción con variantes, tamaños, loading, disabled y focus-visible compartidos.
- [x] 3.2 Crear los componentes `x-ui.field`, `x-ui.select` y `x-ui.textarea` con label, ayuda, error, atributos Livewire/Alpine y estados accesibles.
- [x] 3.3 Consolidar chips, badges, cards, indicadores de progreso e iconografía con variantes semánticas enumeradas.
- [x] 3.4 Implementar el tratamiento común de acciones destructivas y confirmación proporcional al riesgo.
- [x] 3.5 Cubrir los primitivos con pruebas Blade de atributos, slots, variantes y nombres accesibles.

## 4. Patrones compartidos

- [x] 4.1 Extraer el patrón canónico de búsqueda, limpieza, chip rail, menús de filtro y estado seleccionado.
- [x] 4.2 Crear patrones de metric card, section, list y list item que admitan contenido variable sin estilos locales.
- [x] 4.3 Crear patrones canónicos de dialog, sheet y snackbar con administración de foco, cierre y retorno al activador.
- [x] 4.4 Crear estados compartidos inicial, loading, content, empty, filtered-empty y recoverable-error con acciones opcionales.
- [x] 4.5 Verificar por pruebas de componentes que los patrones propagan `wire:*`, `x-*`, ARIA y `data-*` sin abrir propiedades de presentación arbitrarias.

## 5. Arquetipos y composición responsive

- [x] 5.1 Ampliar `module-shell` para declarar arquetipo y regiones sin cambiar los parámetros de navegación existentes.
- [x] 5.2 Implementar la composición de los arquetipos list, detail y dashboard con acción primaria única y rail responsive.
- [x] 5.3 Implementar la composición de los arquetipos daily-log, settings y guided-flow.
- [x] 5.4 Añadir pruebas estructurales para identidad, navegación, acciones, contenido, contexto y orden semántico de cada arquetipo.
- [x] 5.5 Verificar a 390, 768 y 1440 px que los arquetipos no pierdan acciones esenciales ni produzcan overflow horizontal de página.

## 6. Catálogo visual

- [x] 6.1 Crear una ruta de catálogo disponible únicamente en entornos `local` y `testing`, con prueba negativa para producción.
- [x] 6.2 Crear fixtures deterministas sin datos personales para renderizar cada primitivo, patrón y arquetipo.
- [x] 6.3 Mostrar variantes, estados interactivos, contenido largo, valores ausentes y densidades representativas de cada componente.
- [x] 6.4 Añadir navegación y documentación de uso al catálogo y exigir que cada componente canónico tenga al menos un ejemplo.

## 7. Pruebas de navegador y CI

- [x] 7.1 Incorporar Playwright y axe como dependencias de desarrollo con scripts separados para interacción, accesibilidad y actualización visual deliberada.
- [x] 7.2 Configurar navegador, fuentes, reloj, datos, autenticación y animaciones deterministas para evitar capturas inestables.
- [x] 7.3 Añadir pruebas de teclado y foco para campos, menús, diálogos, hojas y snackbars canónicos.
- [x] 7.4 Crear baselines visuales del catálogo y de una pantalla representativa por arquetipo en los tres viewports de referencia.
- [x] 7.5 Integrar en CI el orden rápido de fallos: conformidad estática, pruebas PHP/JavaScript, accesibilidad y regresión visual.

## 8. Migración por patrones

- [x] 8.1 Migrar todas las búsquedas y filtros, incluyendo Agua, Pomodoro, Estadísticas y catálogo de Vehículos, y retirar sus entradas del baseline.
- [x] 8.2 Migrar métricas y resúmenes de Estadísticas, Ajustes, Agua, Ánimo, Pomodoro y Ejercicio a los patrones compartidos.
- [ ] 8.3 Migrar formularios y validación visual a los fields canónicos sin cambiar propiedades, reglas o acciones Livewire.
- [ ] 8.4 Migrar diálogos, confirmaciones destructivas y estados de datos a los patrones canónicos, verificando manejo de foco.
- [ ] 8.5 Migrar listados y detalles existentes a los arquetipos list/detail, manteniendo tabs, filtros URL y rails contextuales.
- [ ] 8.6 Migrar dashboards, registros diarios, configuración y flujos guiados a sus arquetipos correspondientes.
- [ ] 8.7 Construir las nuevas superficies requeridas por Relaciones y emociones exclusivamente con los componentes y arquetipos canónicos disponibles.

## 9. Cierre de la adopción

- [x] 9.1 Ejecutar la suite funcional existente y corregir regresiones de navegación, Livewire, Alpine y responsive introducidas por la migración.
- [x] 9.2 Revisar todas las rutas protegidas para confirmar shell único, arquetipo declarado, estados completos y acción primaria coherente.
- [x] 9.3 Eliminar selectores, excepciones y entradas de baseline sin consumidores, conservando únicamente custom properties dinámicas justificadas.
- [x] 9.4 Ejecutar build de producción, pruebas PHP/JavaScript, conformidad, accesibilidad y regresión visual con resultado satisfactorio.
- [x] 9.5 Actualizar las convenciones del proyecto y la definición de terminado para exigir catálogo, responsive, accesibilidad y pruebas visuales en futuras superficies.
