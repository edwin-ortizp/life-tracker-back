# LogViewer

Accede a `/log-viewer` con tu sesion de Life Tracker. Configura en `.env`:

```dotenv
LOG_VIEWER_ENABLED=true
LOG_VIEWER_ALLOWED_EMAILS="admin@example.com,developer@example.com"
```

Los correos se normalizan a minusculas y se recortan los espacios. Una lista vacia deniega acceso en todos los entornos. Si hay configuracion cacheada, regenerala con `php artisan config:cache` despues de cambiar las variables.

La pantalla permite buscar, filtrar, descargar y eliminar archivos de `storage/logs`, incluidos los diarios. Eliminar un archivo borra sus registros; Laravel vuelve a crearlo al escribir nuevos eventos. Las confirmaciones son las del paquete. Los logs son globales a la aplicacion.

La pagina y la API requieren sesion, autorizacion y CSRF para escrituras. La PWA excluye estas rutas del cache. Para desactivar las rutas establece `LOG_VIEWER_ENABLED=false` y actualiza la configuracion cacheada.

LogViewer 3.24.2 sirve sus assets desde `vendor`; no necesita publicarlos ni compilarlos con Vite. En despliegues, instala dependencias de produccion con Composer y actualiza el cache de configuracion y rutas segun el procedimiento habitual. No publiques vistas ni assets salvo que se decida personalizarlos; si se publican, deben actualizarse con cada nueva version del paquete.
