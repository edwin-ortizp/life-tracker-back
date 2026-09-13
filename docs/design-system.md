# Sistema de experiencia de Life Tracker

## Dirección

La interfaz se comporta como una cabina serena: alta densidad de información, jerarquía clara y pocas decoraciones sin función. Material 3 aporta tokens, color, forma y estados; Bootstrap queda limitado a utilidades de transición y grids existentes.

## Anatomía de un módulo

1. `x-module-shell` genera la identidad del módulo desde `config/modules.php`.
2. `x-module-tabs` representa vistas con rutas reales y conserva únicamente los query params declarados por el módulo.
3. `x-action-bar` contiene navegación temporal, filtros principales y acciones de creación.
4. `.md-module-workspace` divide contenido principal y rail contextual.
5. `x-context-widget` contiene resúmenes, calendarios o accesos relacionados; no debe duplicar la lista principal.
6. `x-empty-state` unifica pantallas sin datos y debe incluir una siguiente acción cuando exista.

### Identidad en la barra superior

La identidad de la pantalla vive **una sola vez**, en la barra superior: botón de menú → icono del módulo → título.

- El icono del módulo va inmediatamente a la derecha del botón de menú, dentro de un contenedor redondeado con fondo tonal del acento del módulo (`color-mix` del acento sobre `--md-surface-lowest`) y el glifo en el color de acento.
- El título de la barra es el título de la pantalla. Si la vista pertenece a una entidad, la incluye: `Combustible · Mazda 3`, `Camila Rojas`.
- No se repite el título dentro del contenido: no hay bloque de encabezado con icono, título grande ni subtítulo descriptivo debajo de la barra. El contenido empieza con `Volver` (solo en vistas de detalle), las pestañas o las métricas.
- Los datos que antes iban en el subtítulo y que sí aportan información (fecha del registro, placa, periodo) se trasladan a un control o métrica visible, nunca a texto decorativo.
- En móvil se conserva el mismo orden; el icono se reduce a 36 px y el título se trunca con elipsis.

Referencia visual: macro `shell` en `docs/mockup-system/components/life-shell.html.jinja` (clase `.lt-topbar__icon`).

## Categorías y color de módulo

Cada módulo tiene un color de énfasis simbólico (`--lt-accent`) que se usa en su pantalla y en su ítem del menú lateral; los módulos de una misma categoría comparten familia de color. Tokens en `resources/css/m3/tokens/_tokens.css` (`[data-module]` → `--md-module-accent`); cada ítem de `modules.navigation` declara su `module`. Referencia visual en `docs/mockup-system/project-assets/mockups.css`.

| Categoría | Módulos y acento |
| --- | --- |
| Vista general | Mi día #3949AB · Estadísticas #3949AB · Ajustes #5B5F97 |
| Salud y cuerpo | Salud #C62828 · Ejercicio #E65100 · Hidratación #0277BD · Comidas #558B2F |
| Hábitos | Hábitos #2E7D4F · Hábitos a evitar #8A5A00 |
| Productividad | Tareas #2F53C8 · Pomodoro #4527A0 · Objetivos #00786E |
| Vida personal | Diario #6A1B9A · Relaciones #8E24AA · Planes #AD1457 · Ánimo y energía #7B1FA2 |
| Vehículos | Vehículos #455A64 |

## Reglas de navegación

- Una vista funcional equivale a una ruta; no se usan pestañas para alternar contenido importante solo en memoria.
- Los enlaces preservan estado compartible con nombres estables: `date`, `week`, `period`, `status`, `category` y equivalentes registrados.
- Un módulo con una sola vista no muestra pestañas.
- Los ajustes específicos pertenecen al módulo. Ajustes generales conserva perfil, seguridad y preferencias transversales.
- Las rutas históricas se mantienen como redirects cuando cambia la URL canónica.

## Responsive y accesibilidad

Existe **un solo marco de aplicación para todos los anchos**. No hay variante por dispositivo: ni capa de vistas paralela, ni detección de user-agent, ni una clase que JavaScript alterne para simular un breakpoint. El ancho del viewport es el único interruptor, y quien lo lee es el CSS. JavaScript decide comportamiento (qué hace el botón de menú, qué etiqueta accesible le corresponde), nunca visibilidad.

- Desde 1200 px, el workspace usa contenido flexible más un rail de 320 px.
- Desde 1024 px, la barra lateral se muestra expandida y puede colapsarse a raíl.
- Entre 768 y 1023 px, la barra lateral se queda en raíl y el rail contextual baja, con hasta dos widgets por fila.
- Por debajo de 768 px, la barra lateral se superpone, los destinos principales bajan a la barra inferior, todo fluye en una columna y las pestañas tienen desplazamiento horizontal.
- El marco se sirve con `viewport-fit=cover`, así que todo lo que toca un borde devuelve el notch y la barra de gestos con los tokens `--lt-safe-*`.
- Controles interactivos nuevos: mínimo 44 px, foco visible, etiqueta accesible y contraste AA.
- El contenido debe seguir siendo operable con `prefers-reduced-motion`.

## Capas del sistema

El CSS se organiza en `resources/css/m3` con dependencias unidireccionales. Cada capa puede consumir las anteriores y ninguna puede depender de una posterior.

| Capa | Directorio | Contenido |
| --- | --- | --- |
| 1. Tokens | `tokens/` | Color, tipografía, espacio, forma, elevación, movimiento, breakpoints y z-index. |
| 2. Primitives | `primitives/` | Botón, icon button, campo, chip, card, badge, progress y tratamiento de foco. |
| 3. Patterns | `patterns/` | Búsqueda y filtros, métricas, listas, diálogos, hojas, snackbars y estados de datos. |
| 4. Archetypes | `archetypes/` | Layout, navegación, shell y composición de arquetipos de pantalla. |
| 5. Modules | `modules/` | Estilos exclusivos de un dominio que componen las capas anteriores. |

Los archivos de módulo no redefinen selectores base. Los overrides heredados están inventariados en `resources/ui/css-layer-baseline.json` y se retiran al migrar cada módulo. `tests/Feature/Ui/CssLayerContractTest.php` verifica el orden de importación, la ausencia de dependencias hacia capas posteriores y que no se agreguen overrides nuevos.

El prefijo de clases del sistema es `md-`. La API Blade de los componentes canónicos vive en el namespace `x-ui.*`.

## Variantes semánticas admitidas

Las diferencias legítimas se expresan eligiendo una variante enumerada, nunca redefiniendo estructura o estilo en la vista.

- **Énfasis de acción**: `filled` (acción primaria única por contexto), `tonal`, `outlined`, `text`.
- **Tono semántico**: `neutral`, `primary`, `success`, `warning`, `danger`, `info`.
- **Tamaño de acción**: `sm`, `md`, `lg`.
- **Estado de control**: `normal`, `hover`, `focus-visible`, `pressed`, `disabled`, `loading`, `error`.
- **Estado de datos**: `initial`, `loading`, `content`, `empty`, `filtered-empty`, `error`.
- **Arquetipo de pantalla**: `list`, `detail`, `dashboard`, `daily-log`, `settings`, `guided-flow`.

Un componente canónico solo acepta propiedades semánticas y slots; no acepta colores, paddings ni tamaños arbitrarios.

## Incorporar un token o una variante

1. Comprobar que la necesidad no se resuelve con un token o variante existente.
2. Confirmar que existe al menos un caso real que la consuma; no se agregan variantes especulativas.
3. Declarar el token en `resources/css/m3/tokens/_tokens.css` o la variante en la capa que le corresponde.
4. Añadir el caso al catálogo interno para que quede documentado y cubierto por las pruebas visuales.
5. Registrar la variante en la lista anterior y consumirla desde la pantalla.

Los valores calculados que no pueden expresarse con variantes discretas se transmiten mediante las custom properties declaradas en `config/ui-conformance.php`; cualquier otra declaración `style` incumple la conformidad.

## Conformidad

- `php artisan ui:conformance` compara las vistas Blade contra el contrato y contra el inventario de deuda de `resources/ui/conformance-baseline.json`.
- `php artisan ui:conformance --list` enumera cada desviación con archivo, línea, regla y región.
- `php artisan ui:conformance --update-baseline` regenera el inventario; solo debe reducirlo.
- Las excepciones duraderas se declaran en `config/ui-conformance.php` con motivo y alcance, nunca como comentarios dispersos.

## Sin banner de módulo

Las pantallas no llevan banner (`md-module-header`). La identidad vive en la barra superior (`x-module-shell` envía el `title` de detalle, como el nombre de una persona, a esa barra) y el `<h1>` queda oculto para lectores de pantalla. Las acciones de crear son el FAB, las secundarias van al menú ⋮ y la navegación temporal o los filtros de período van en el slot `controls`, nunca en `actions`.

## Acciones de creación

Regla transversal y obligatoria para producción y mockups: **toda acción cuyo fin principal sea crear, registrar o agregar un elemento es un FAB, y el FAB abre el modal de formulario estándar sobre la pantalla actual.**

- **Componente único**: `x-ui.fab` (o `x-module-actions`, que lo renderiza como acción `primary`). En mockups, la macro `fab()` de `life-shell.html.jinja`. Posición, espaciado, tamaño, estados y responsive viven solo ahí; ningún módulo los redefine.
- **Escritorio**: FAB extendido, rectángulo redondeado con ícono y texto de la acción en infinitivo + objeto: «Registrar evento», «Agregar objetivo», «Crear receta».
- **Móvil (< 768 px)**: solo ícono, con `aria-label` igual al texto; se sitúa por encima de la barra inferior.
- **Varias opciones**: las creaciones alternativas del mismo contexto se despliegan desde el FAB (menú FAB) con el mismo patrón visual. En `x-module-actions`, marca la secundaria con `'create' => true`; en `x-ui.fab`, pásalas en `actions`. Las acciones que no crean (archivar, navegar, configurar) van al menú ⋮.
- **Jerarquía**: se teletransporta a `<body>` con `--md-sys-z-fab-floating`; queda sobre acordeones, menús, ⋮ y paneles, bajo los diálogos, y se oculta mientras hay un modal abierto.
- **Estados**: hover, foco visible, presionado y deshabilitado vienen del componente.
- **Destino**: al activarse abre `x-ui.form-dialog` (ver abajo) sin navegar a otra vista. Editar un elemento reutiliza el mismo modal.
- **No permitido**: botones `filled`/`tonal`/`outlined` sueltos en el encabezado o en secciones para crear, `x-ui.dialog` o `md-dialog` artesanales para formularios de alta, y páginas dedicadas de creación. Los estados vacíos pueden repetir la acción como recuperación. `php artisan ui:conformance` lo vigila con la regla `create-action-pattern`.

## Modales con formulario

Componente: `x-ui.form-dialog` con `x-ui.form-dialog-section`. Campos: `x-ui.field`, `x-ui.select`, `x-ui.textarea` y `x-ui.multi-select`, todos con prop `icon` opcional.

En los editores aislados de Salud y Tareas, la visibilidad y los borradores se controlan en Alpine (`ltFormEditor`): abrir o cerrar no requiere una petición. `x-ui.form-dialog` admite `state` y `title-expression`; el modo existente con `open` sigue disponible para los demás módulos. La edición muestra primero la superficie con carga/error y obtiene el registro en el componente hijo; guardar valida en el servidor y notifica a la lista. Usa `wire:model` para campos sin dependencias de servidor. `x-ui.multi-select` admite `:live="false"` para diferir sincronización y `model-expression` para un borrador Alpine que solo se envía al aplicar filtros. El formulario admite `validation-state="submitted"` para reiniciar visualmente los errores de un borrador sin otra petición. Los campos admiten `label-expression` cuando su etiqueta depende de ese estado local. Consulta [el diagnóstico y las mediciones](performance.md) antes de extender este patrón a otro módulo.

Patrón común y obligatorio para todo modal que crea o edita información, y destino de todo FAB de creación. Usa secciones cuando el formulario tiene más de un grupo de campos.

- **Cabecera** separada del contenido por una línea divisoria. En orden: control del panel de secciones (solo si hay secciones), ícono de contexto, título, acción expandir/restaurar y cerrar. El título nunca se oculta.
- **Panel de secciones** a la izquierda para formularios largos (por ejemplo: Información básica, Detalles adicionales, Archivos y adjuntos, Resumen). Es un menú, no un wizard: se entra a cualquier sección sin completar la anterior, sin números, progreso ni subtítulos. Es colapsable; al contraerlo solo desaparece la navegación y el formulario gana ancho. En móvil arranca contraído y se superpone.
- **Información básica** contiene solo los datos esenciales; notas, contexto y adjuntos van en las demás secciones.
- **Footer** separado por una línea divisoria: `Cancelar` (text) completamente a la izquierda y `Guardar` (filled) completamente a la derecha. Sin otras variantes de texto.
- **Expandir** ocupa casi todo el viewport manteniendo el overlay; no usa el fullscreen del navegador. Restaurar conserva los datos y la sección activa.
- Se cierra con la ×, Cancelar, clic en el overlay o Esc.

### Campos (outlined, Material Design 3)

Base visual de **todos** los formularios, no solo de los modales:

- Borde de 1 px, radio 8 px, altura 56 px (textarea desde 120 px).
- El label va sobre el borde e interrumpe el outline; no se coloca como texto separado encima del campo.
- Ícono inicial opcional; los select muestran chevron propio.
- Estados: hover (borde on-surface), focus (borde 2 px del acento y label del mismo color), error (borde, label y ayuda en rojo), disabled (opacidad .38).
- Obligatorio: asterisco rojo junto al label.

## Menús, filtros y botón flotante

- **Más opciones (⋮)**: `x-ui.menu` con `x-ui.menu-item` y `x-ui.menu-divider`. La acción principal queda visible (tonal o filled) y las secundarias van al menú, con las destructivas al final tras un divisor y `tone="danger"`. Nunca un grupo de botones grandes sueltos.
- **Filtros**: un único botón "Filtros" (outlined) que abre `x-ui.popover` con todas las opciones, incluido el rango de tiempo; no se duplica el concepto con un selector aparte. Con filtros activos el botón lleva `x-ui.badge placement="corner"` con el número. Debajo se listan como chips removibles y, si hay al menos uno, el enlace "Limpiar filtros".
- **Opciones simples y múltiples**: `x-ui.select` para una opción, `x-ui.multi-select` (checkboxes) para varias.
- **Botón flotante**: ver [Acciones de creación](#acciones-de-creación).
- **Pestañas de módulo**: sin fondo ni pastilla; el estado activo es el color de acento con un indicador inferior de 3 px.

## Definición de terminado para una superficie nueva

Una pantalla o componente no está terminado hasta que cumple todo lo siguiente:

1. **Compone el shell y declara su arquetipo.** `x-module-shell` con `archetype` propio o declarado en `config/modules.php`. Nunca una composición aislada.
2. **Reutiliza los componentes canónicos.** Búsqueda, filtros, métricas, secciones, listas, campos, diálogos, hojas, snackbars, chips y estados vienen de `x-ui.*`.
3. **Cubre sus estados de datos.** Inicial, cargando, con contenido, vacío, sin resultados filtrados y error recuperable, distinguiendo vacío de filtrado con `App\Support\Ui\DataState`.
4. **Aparece en el catálogo.** Todo componente canónico nuevo se publica en `/ui-catalog` con al menos un ejemplo en la misma contribución.
5. **Pasa la conformidad estática.** `php artisan ui:conformance` sin deuda nueva; si toca una región inventariada, la migra y reduce el baseline.
6. **Es responsive a 390, 768 y 1440 px.** Sin desplazamiento horizontal de página ni pérdida de acciones esenciales.
7. **Es accesible.** Nombre accesible en cada control, foco visible, orden lógico, diálogos con foco contenido y retorno al activador, y `npm run test:a11y` en verde.
8. **Tiene referencia visual.** `npm run test:visual` en verde; actualizar un baseline es explícito (`npm run test:visual:update`) y se revisa junto al cambio.

## Comandos de calidad de interfaz

```bash
php artisan ui:conformance          # conformidad estática contra el inventario
php artisan ui:conformance --list   # cada desviación con archivo y línea
npm run test:browser                # teclado y foco
npm run test:a11y                   # accesibilidad automatizada (axe)
npm run test:responsive             # 390, 768 y 1440 px
npm run test:visual                 # regresión visual
npm run test:visual:update          # actualización deliberada de baselines
```

CI ejecuta ese orden de fallo rápido en `.github/workflows/ui-quality.yml`.

## Datos y configuración

- No se crea una segunda fuente de verdad por conveniencia visual.
- La meta manual de hidratación permanece en `users.daily_water_goal`; su interfaz principal vive en `/water/settings`.
- `module_settings` se reserva para preferencias que no tienen una columna o entidad propia, como metas de Pomodoro.
