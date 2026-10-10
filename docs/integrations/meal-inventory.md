# Comidas, preparaciones e inventario

La planificación no cambia el stock. Todos los registros anteriores siguen siendo planes: la migración no infiere consumo ni descuenta compras antiguas.

## Operaciones

- **Planificar:** recetas y porciones, elementos libres con ingredientes opcionales, o porciones de una preparación. Las preparaciones se reservan al planificar; no es posible reservar más que su saldo. Los ingredientes de recetas son para su rendimiento total (`servings`).
- **Cocinar:** descuenta ingredientes proporcionalmente a las porciones producidas y guarda una preparación con ingredientes y nutrición copiados. Cocinar seis porciones de una receta que rinde seis utiliza una vez sus ingredientes.
- **Consumir:** aplica a la casilla completa. Descuenta ingredientes de recetas y elementos enlazados, o porciones preparadas. Los elementos libres sin enlaces se registran sin descuento y con advertencia de inventario incompleto.
- **Comida por fuera:** conserva los componentes planeados, no descuenta nada y libera sus reservas. Notas y calorías consumidas son independientes de las del plan; se admite una casilla sin plan anterior.
- **Revertir:** devuelve los movimientos originales y restaura las reservas. No recalcula con el catálogo o la receta actuales. Si cambió la unidad base de un producto, se rechaza hasta resolver la incompatibilidad. También se rechaza si una reserva liberada por comida por fuera ya no puede recuperarse.
- **Cancelar preparación:** devuelve ingredientes únicamente cuando no tiene consumos ni reservas. Se conserva el historial y no se elimina la preparación.

Las escrituras usan `MealInventory`: transacción, bloqueo del usuario como orden común de serialización, bloqueo de productos/preparaciones y clave de operación única por usuario. Repetir una clave con los mismos datos devuelve el resultado registrado; con otros datos se rechaza. El libro `meal_inventory_movements` conserva cantidades efectivas y unidades; una reversión agrega movimientos opuestos y marca la operación original. Los faltantes o cantidades incompatibles revierten la operación completa.

## Web y MCP

La web dispone del editor semanal, **Preparaciones**, **Qué cocinar** y la previsualización **Generar compras del plan** desde el FAB de Compras. Las acciones de mover/copiar/intercambiar operan sobre la comida guardada. Para cambiar solo un componente se edita la composición y se guarda la casilla.

Herramientas:

| Herramienta | Contrato |
| --- | --- |
| `plan-meal-tool` | Conserva fecha, tipo, elementos, notas, calorías y append/replace. Agrega `operation_key`, `preparation_id` e ingredientes `{shopping_item_id, quantity, unit}` para elementos libres. |
| `list-meal-plan-tool` | Conserva `items` textual y agrega `components` con ids, ingredientes, estado, consumo y preparación. Separa `planned_calories` y `consumed_calories`; el total diario legado `calories` corresponde a planes pendientes. |
| `consume-meal-tool` | `action=consume/revert`, `meal_id`, `mode=home/outside`, fecha efectiva, notas y calorías opcionales; `operation_key` obligatoria. Para registrar por fuera sin plan, enviar fecha y tipo en lugar del id. |
| `manage-meal-tool` | `action=edit/move/copy/swap/delete`, `meal_id`, clave estable. Editar envía todos los componentes, identificando los existentes. Mover/copiar/intercambiar exige fecha y tipo destino. |
| `manage-preparation-tool` | `action=cook/list/detail/cancel`. Cocinar necesita receta, porciones y clave; fecha de cocinado y fecha límite opcionales. Consultas incluyen saldo, consumo y reservas. |
| `suggest-meals-tool` | Porciones y horizonte de vencimiento (7 días por defecto). Disponibilidad, cantidades necesarias/faltantes y fechas de productos/preparaciones, separados en vencidos y próximos. |
| `generate-meal-shopping-tool` | `action=preview/generate`, intervalo y elecciones `{shopping_item_id, variant_id}`. Generar requiere clave estable. Usa la presentación preferida comparable o exige una elección. |

Mover añade al destino ocupado y combina porciones si la misma receta ya está allí. Copiar conserva el origen y valida reservas adicionales. Intercambiar conserva ids de componentes; las comidas consumidas exigen reversión antes de modificar o eliminar. No hay API REST adicional.

## Necesidades y fechas

`MealNeeds` comparte el cálculo entre web y MCP: solo planes pendientes, excluyendo ingredientes de preparaciones cocinadas. Normaliza unidades, agrupa productos y resta el stock una vez. Las cantidades incompatibles quedan incompletas. Generar compras calcula paquetes con redondeo hacia arriba y conserva el máximo entre la cantidad manual y la necesaria; no acumula paquetes al repetirlo.

Las fechas son `consume_by` por producto y una fecha opcional por preparación; **no representan lotes**. Las sugerencias y operaciones avisan de fechas próximas o pasadas, sin bloquear automáticamente alimentos. La migración añade tablas y campos; no hace modificaciones retroactivas del inventario. Aplicar las migraciones en el entorno de destino antes de usar las superficies nuevas.

## Validación

Pruebas focalizadas: `MealInventoryTest`, `MealInventoryMcpTest`, planificación y contratos MCP existentes. El navegador usa exclusivamente `storage/framework/testing/purchase-browser.sqlite` y verifica ese destino antes de inicializarlo. Los escenarios `meal inventory` cubren escritorio/móvil y dos procesos de consumo que compiten por el mismo stock; SQLite no sustituye una validación de bloqueos en el MySQL del despliegue.
