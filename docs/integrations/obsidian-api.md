# API de importación Obsidian → LifeTracker

La API está pensada para un flujo local de n8n. Usa el token generado en **Ajustes → Integración con Obsidian** como credencial Bearer.

Base URL: `<APP_URL>/api/v1/integrations`. Usa la misma URL base configurada para LifeTracker en el entorno donde se ejecuta n8n.

## Catálogo de ánimo

`GET /mood-states` devuelve los estados configurados para el usuario del token. n8n debe usar uno de los valores `id` recibidos al crear un registro de ánimo.

## Crear registros

Todos los `POST` requieren `Authorization: Bearer <token>` y una `source_key` estable por nota, por ejemplo `daily/2026-07-13.md`.

`POST /journal-entries`

```json
{"source_key":"daily/2026-07-13.md","date":"2026-07-13","summary":"Resumen breve generado desde Obsidian."}
```

`POST /mood-entries`

```json
{"source_key":"daily/2026-07-13.md","date":"2026-07-13","time":"21:00","mood_state_id":"uuid-del-catalogo"}
```

`POST /energy-entries`

```json
{"source_key":"daily/2026-07-13.md","date":"2026-07-13","time":"21:00","level":4,"comment":"Buen nivel de energía durante la tarde."}
```

Una clave ya importada devuelve `200` con `status: "skipped"`; nunca actualiza la primera importación. Si hay un diario manual en la fecha indicada, el endpoint de diario responde `skipped` con `reason: "journal_exists"`; los endpoints de ánimo y energía siguen siendo independientes.

## Flujo de n8n

1. Ejecuta un disparador cada 15 minutos y lee las notas diarias desde un directorio local de sólo lectura.
2. Obtén `GET /mood-states` con el token y entrega ese catálogo a la IA junto con el texto de la nota.
3. Exige este JSON de salida; los campos de ánimo y energía deben ser `null` si no son claros:

```json
{
  "summary": "resumen breve",
  "mood_state_id": "uuid o null",
  "mood_time": "HH:MM o null",
  "energy_level": "1-5 o null",
  "energy_time": "HH:MM o null",
  "energy_comment": "texto breve o null"
}
```

4. Envía siempre el diario y, sólo cuando no sean nulos, los registros de ánimo y energía. Usa la misma `source_key` estable para los tres requests.
5. Desactiva el almacenamiento de datos de ejecuciones exitosas de n8n. En errores, registra únicamente ruta, fecha y código HTTP; no almacenes el Markdown original.
