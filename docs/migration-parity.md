# Matriz de paridad React → Laravel/Livewire

| Área | Referencia archivada | Estado Laravel | Decisión |
|---|---|---|---|
| Shell de módulo | `ModuleViewLayout` | Shell Blade central | Rediseñado y aplicado globalmente |
| Navegación secundaria | Registros `views.ts` | Rutas Livewire parciales | Centralizada en `config/modules.php` |
| Hidratación diaria | `WaterPage` | CRUD completo | Conservado dentro del nuevo shell |
| Calendario mensual de agua | `WaterMonthlySidebar` | No existía | Recuperado como widget y vista propia |
| Estadística semanal/rango de agua | `WeeklyStats`, `RangeStats` | No existía | Recuperada con rutas propias |
| Ajustes de hidratación | `WaterConfigPage` | Modal y ajuste global | Consolidado en `/water/settings` |
| Diario + ánimo | `JournalWithMood` | Módulos separados | Recuperado como rail operable del Diario |
| Life Calendar | `LifeCalendar` | Ya migrado | Conservado y normalizado en tabs comunes |
| Pomodoro mensual | `PomodoroMonthlySidebar` | No existía | Recuperado como rail contextual |
| Tareas multivista | `task/views.ts` | Seis vistas Livewire | Conservado; tabs y cabecera centralizados |
| Inicio | `HomePage` y quick widgets | Dashboard básico | Rediseñado como “Mi día” con fecha coordinada |
| Hábitos, Salud | Vistas diaria/analítica | Rutas Livewire existentes | Conservadas y normalizadas |
| Ejercicio, Ánimo, Comidas | Pantallas operativas | Pantallas Livewire existentes | Conservadas dentro del shell; vistas históricas pendientes se evaluarán por valor |
| Objetivos, Relaciones, Vehículos | Módulos especializados | Pantallas Livewire existentes | Conservados; mantienen layouts propios dentro del shell |
| Recetas | `recipe` | Modelos sin pantalla Livewire | Pendiente de migración funcional separada |
| Lista de compras | `shopping-list` | Modelos sin pantalla Livewire | Pendiente de migración funcional separada |
| Comidas preparadas | `prepared-meals` | Modelos sin pantalla Livewire | Pendiente de migración funcional separada |

## Criterio para trabajo pendiente

Una capacidad archivada se recupera solo si resuelve una tarea vigente y los datos Laravel permiten implementarla sin reactivar React ni duplicar almacenamiento. Los tres módulos sin pantalla requieren especificación funcional y pruebas propias antes de aparecer en navegación.
