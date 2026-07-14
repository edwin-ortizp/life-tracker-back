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

## Datos y configuración

- No se crea una segunda fuente de verdad por conveniencia visual.
- La meta manual de hidratación permanece en `users.daily_water_goal`; su interfaz principal vive en `/water/settings`.
- `module_settings` se reserva para preferencias que no tienen una columna o entidad propia, como metas de Pomodoro.
