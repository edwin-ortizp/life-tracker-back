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

## Reglas de navegación

- Una vista funcional equivale a una ruta; no se usan pestañas para alternar contenido importante solo en memoria.
- Los enlaces preservan estado compartible con nombres estables: `date`, `week`, `period`, `status`, `category` y equivalentes registrados.
- Un módulo con una sola vista no muestra pestañas.
- Los ajustes específicos pertenecen al módulo. Ajustes generales conserva perfil, seguridad y preferencias transversales.
- Las rutas históricas se mantienen como redirects cuando cambia la URL canónica.

## Responsive y accesibilidad

- Desde 1200 px, el workspace usa contenido flexible más un rail de 320 px.
- Entre 768 y 1199 px, el rail baja y presenta hasta dos widgets por fila.
- Por debajo de 768 px, todo fluye en una columna y las pestañas tienen desplazamiento horizontal.
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
