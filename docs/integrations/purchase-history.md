# Compras e historial

Compras permite registrar un ticket completo desde el FAB «Registrar compra». El diálogo admite productos del catálogo, aunque no estén pendientes. «Marcar comprado» conserva el flujo rápido y registra una compra de una línea.

El historial está en Comidas → Historial de compras (`/meals/purchases`). Permite filtrar por fechas, tienda y producto, consultar el detalle y editar. La ficha del ingrediente, sección Inventario, muestra última compra y conteos de compras distintas en 30/60/90 días.

## Comportamiento

- La compra y sus efectos sobre stock, lista y precios se guardan en una transacción. La fecha del precio de ticket corresponde a la fecha de compra.
- Cada línea conserva nombre, presentación, contenido y cantidad añadida al stock. Una edición de precio o cabecera no recalcula cantidades usando un catálogo que haya cambiado. Cambiar producto, presentación o paquetes sí recalcula el aporte.
- Editar aplica diferencias al stock actual y rechaza la operación completa si quedara negativo. Los productos ya presentes en la compra no vuelven a retirarse de la lista; los nuevos sí. Quitar una línea no vuelve a añadirla a pendientes.
- Los precios enlazados se corrigen desde la compra; el editor del catálogo los presenta de solo lectura. Los precios independientes no se modifican.
- El total pagado es opcional e independiente de la suma de líneas. Un precio ausente no equivale a cero; la suma se indica como incompleta.
- La referencia del ticket es única por usuario y tienda cuando está informada. La clave de operación permite reintentos sin duplicar registros.
- Productos, presentaciones y tiendas referenciados no se eliminan. Fusionar tiendas mueve también las compras; referencias duplicadas bloquean la fusión.

No se reconstruye historial a partir de precios previos. Esta entrega no incluye vencimientos, consumo, desperdicio, métricas de gasto ni importación automática.

## MCP

- `create-purchase-tool`: `purchased_at`, `store_id`, `operation_key` (UUID estable) y `lines` obligatorios. Opcionales: `total_paid`, `payment_method`, `ticket_reference`, `notes`.
- Cada línea contiene `shopping_item_id`, `packages` y, opcionalmente, `shopping_item_variant_id`, `unit_price` (final por paquete) y `ticket_text`. Un precio requiere variante y tienda.
- `update-purchase-tool`: `purchase_id`, cabecera y conjunto completo de líneas. Identificar las existentes por `id`; omitir una línea la elimina. Enviar los valores opcionales que se quieran conservar y `null` para vaciarlos.
- `get-purchase-tool`: detalle mediante `purchase_id`.
- `list-purchases-tool`: filtros `from`, `to`, `store_id`, `item_id`, `page`; páginas de 25 compras, ordenadas de más reciente a más antigua.
- `list-shopping-items-tool`: añade `purchase_history` con `last_purchase`, `never_purchased` y `counts`. `not_purchased_days` incluye nunca comprados; usar `only_pending: false` para consultar todo el catálogo.
- `mark-purchased-tool`: conserva sus parámetros y acepta `operation_key` opcional; su respuesta identifica la compra registrada.

Las fechas sin offset usan America/Bogota. Los conteos incluyen el límite de N días y excluyen fechas futuras. No expresan duración real del producto.

## Validación local

```powershell
php artisan test --filter="PurchaseHistoryTest|PurchaseMcpTest|ComparablePricesTest|LifeTrackerShoppingMcpTest"
npm run build
php artisan ui:conformance
npx playwright test --config tests/Browser/purchases.config.js
git diff --check
```

La suite de navegador usa exclusivamente `storage/framework/testing/purchase-browser.sqlite`, con fixtures propios. No migra ni consulta la base configurada de uso diario. Para habilitar la funcionalidad en una instalación, aplicar la nueva migración mediante el procedimiento habitual del proyecto.
