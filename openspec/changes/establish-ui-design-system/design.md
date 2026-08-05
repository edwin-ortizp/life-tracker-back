## Context

Life Tracker renderiza páginas Livewire con Blade y carga un sistema CSS M3 desde `resources/css/app.css`. Ya existen tokens, estilos de componentes, `module-shell`, tabs, acciones y algunos elementos compartidos, además de pruebas que comprueban el shell en las rutas protegidas. Al mismo tiempo, muchas vistas construyen métricas, formularios, estados vacíos y acciones directamente; conviven clases M3, utilidades Bootstrap/Tailwind y estilos inline.

Los cambios `expand-relationship-management` y `connect-emotions-with-relationships` agregarán varias pantallas y patrones nuevos. El sistema debe poder adoptarse de manera incremental, sin exigir una reescritura simultánea de todos los módulos ni alterar su lógica Livewire.

## Goals / Non-Goals

**Goals:**

- Convertir los estilos M3 existentes en una arquitectura con contratos claros entre tokens, componentes, patrones, arquetipos y módulos.
- Proporcionar APIs Blade pequeñas y componibles para los patrones repetidos, preservando slots, atributos Livewire y Alpine.
- Hacer observable el sistema mediante un catálogo determinista y capturas visuales.
- Impedir nueva deuda desde el comienzo y reducir la existente cuando se toque cada superficie.
- Integrar accesibilidad y responsive en el contrato de los componentes, no como revisión posterior.

**Non-Goals:**

- Reescribir la lógica de negocio o el estado de los componentes Livewire.
- Adoptar una biblioteca visual externa que reemplace Material Design 3.
- Migrar todas las vistas en una sola entrega.
- Prohibir utilidades de layout durante la transición cuando no redefinan la apariencia de un componente.
- Buscar igualdad pixel a pixel entre módulos con propósitos distintos; la consistencia se aplica a estructura, interacción y lenguaje visual compartidos.

## Decisions

### Organizar el sistema en cinco capas con dependencias unidireccionales

La arquitectura será:

1. `tokens`: color, tipografía, espacio, forma, elevación, movimiento, breakpoints y z-index semánticos.
2. `primitives`: botón, icon button, field, chip, card, progress y focus treatment.
3. `patterns`: search/filter rail, metric, list, dialog, sheet, snackbar y estados de datos.
4. `archetypes`: list, detail, dashboard, daily log, settings y guided flow.
5. `modules`: estilos exclusivamente propios del dominio que consumen las capas anteriores.

Cada capa puede depender solo de las anteriores. Los archivos de módulo no redefinirán selectores base del sistema. Se mantendrá el prefijo CSS `md-` para evitar una migración nominal innecesaria y se usará el namespace Blade `x-ui.*` para distinguir la API de componentes nuevos.

Alternativa considerada: reemplazar el CSS actual por una biblioteca o por utilidades Tailwind en cada vista. Se descarta porque reiniciaría decisiones ya consolidadas, aumentaría la mezcla temporal de vocabularios y no resolvería por sí sola la gobernanza.

### Encapsular decisiones repetidas, no todo el marcado

Los componentes Blade canónicos expondrán propiedades semánticas y slots, además de propagar atributos para `wire:*`, `x-*`, ARIA y `data-*`. No aceptarán propiedades de presentación arbitrarias como colores o paddings. Las diferencias legítimas se expresarán mediante variantes enumeradas.

Se extraerán primero búsqueda/filtros, métricas, secciones, listas, campos, dialog/sheet/snackbar, chips de estado y estados vacío/cargando/error. Los componentes específicos de negocio permanecerán en sus módulos y compondrán estos elementos.

Alternativa considerada: crear un componente genérico capaz de renderizar cualquier etiqueta, clase o estilo. Se descarta porque trasladaría la inconsistencia a una API difícil de entender y permitiría evadir el contrato.

### Definir arquetipos como contratos de regiones

El arquetipo no será una página rígida, sino un contrato de regiones: identidad y navegación, acciones, controles, contenido principal, contexto y estados. `module-shell` seguirá siendo la raíz y evolucionará para declarar el arquetipo y resolver su layout responsive.

Los breakpoints de verificación serán 390 px, 768 px y 1440 px. En móvil, acciones y filtros podrán cambiar de disposición, y el rail pasará después del contenido principal; no se ocultará funcionalidad esencial.

Alternativa considerada: diseñar plantillas independientes por módulo. Se descarta porque reproduce el problema actual aunque comparta colores y tipografía.

### Mantener un catálogo interno determinista como referencia ejecutable

Se añadirá una ruta disponible solo en entornos `local` y `testing`. El catálogo renderizará componentes y arquetipos con fixtures locales, sin depender de datos personales ni del estado habitual de la base de datos. Mostrará variantes, estados, contenido largo, ausencia de datos y ejemplos responsive.

El catálogo será simultáneamente documentación, superficie de revisión manual y objetivo principal de pruebas visuales. Cada componente canónico nuevo deberá incorporarse al catálogo en la misma contribución.

Alternativa considerada: documentación Markdown con capturas manuales. Se descarta como única fuente porque se desactualiza y no prueba el marcado o CSS reales.

### Aplicar gobernanza estática mediante reglas y baseline de deuda

Una prueba de arquitectura recorrerá las vistas Blade y reportará archivo, línea y regla. Como mínimo detectará patrones retirados, colores directos, controles alternativos para patrones canónicos y declaraciones `style` no permitidas. Los valores visuales calculados se comunicarán con custom properties específicas incluidas en una lista limitada.

El inventario inicial de infracciones se guardará como baseline versionado. La prueba comparará el estado actual contra ese baseline: una contribución podrá mantener deuda no tocada, pero no agregarla. Cuando se migre una región, sus entradas se eliminarán del baseline.

Las excepciones duraderas vivirán en una configuración central con patrón de archivo, regla, motivo y alcance; no mediante comentarios dispersos que silencien el análisis.

Alternativa considerada: activar todas las prohibiciones inmediatamente. Se descarta porque bloquearía el desarrollo antes de poder migrar las superficies heredadas.

### Usar Playwright y axe para validar comportamiento de navegador

Se incorporará Playwright como dependencia de desarrollo para capturas, interacción responsive y navegación por teclado, y `axe-core` para verificaciones automáticas de accesibilidad. Las pruebas PHP seguirán cubriendo el contrato renderizado y la lógica Livewire; las pruebas de navegador cubrirán aquello que requiere layout, foco y ejecución de JavaScript.

Las referencias visuales incluirán el catálogo y una pantalla representativa por arquetipo en los tres viewports. Los datos, fecha, animaciones y fuentes se estabilizarán para reducir falsos positivos. Actualizar un baseline visual será una acción explícita y revisable.

Alternativa considerada: usar únicamente assertions sobre HTML y clases. Se conserva como primera barrera, pero no detecta cambios de geometría, overflow, foco invisible ni diferencias reales entre resoluciones.

### Migrar por patrón y riesgo, no por módulo completo

La primera ola establecerá tokens faltantes, componentes y catálogo. La segunda migrará patrones repetidos de alto impacto: búsqueda/filtros, métricas, formularios, estados de datos y acciones destructivas. La tercera aplicará arquetipos completos a las pantallas con más desviaciones y a las nuevas superficies de Relaciones y emociones.

Este orden permite que cada extracción tenga varios consumidores y evita reescribir una pantalla completa antes de que existan los componentes necesarios.

## Risks / Trade-offs

- [Los componentes se vuelven demasiado abstractos] → Exponer solo variantes observadas en al menos un caso real y mantener la composición de dominio fuera del sistema base.
- [Las capturas visuales producen falsos positivos en Windows o CI] → Fijar navegador, fuentes, viewport, datos, reloj y animaciones; generar y comparar baselines en el mismo entorno automatizado.
- [El baseline de deuda se convierte en permiso permanente] → Mostrar su conteo en la salida de pruebas y exigir reducirlo cuando se modifique una región inventariada.
- [La migración altera comportamiento Livewire o Alpine] → Mantener pruebas funcionales existentes y migrar primero el marcado sin cambiar nombres de propiedades, eventos o acciones.
- [El catálogo diverge de situaciones reales] → Usar los mismos componentes públicos y agregar casos derivados de defectos reales cuando aparezcan.
- [La mezcla temporal de componentes nuevos y antiguos sigue siendo visible] → Priorizar patrones ubicuos y las pantallas de mayor uso, y retirar selectores heredados tan pronto quede sin consumidores.
- [La suite de navegador alarga el CI] → Ejecutar checks estáticos y PHP primero, paralelizar capturas y limitar la matriz visual a componentes y pantallas representativas.

## Migration Plan

1. Registrar el inventario y baseline inicial de desviaciones sin cambiar la interfaz.
2. Completar tokens semánticos, capas CSS y convenciones de variantes.
3. Implementar los componentes Blade base, el catálogo local y sus pruebas contractuales.
4. Incorporar Playwright/axe y establecer baselines visuales de catálogo y arquetipos.
5. Activar el bloqueo de nueva deuda en CI.
6. Migrar patrones compartidos por oleadas y reducir el baseline en cada una.
7. Consumir el sistema en las nuevas pantallas de Relaciones y emociones.
8. Eliminar selectores, excepciones y estilos heredados cuando no tengan consumidores.

Cada oleada será reversible manteniendo temporalmente el CSS heredado mientras se valida el nuevo consumidor. La reversión restaura el marcado anterior y su entrada de baseline; los componentes base no se eliminarán si ya tienen otros consumidores.
