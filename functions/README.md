# API de Billing Items - Life Tracker

API REST para crear y actualizar ítems de facturación desde sistemas externos como n8n, Postman, Azure DevOps, etc.

## 📋 Descripción

Esta API permite gestionar ítems de facturación para entidades gubernamentales, incluyendo la integración con Azure DevOps para el seguimiento de work items.

### Características principales:

- ✅ **Creación automática** de ítems cuando no existen
- ✅ **Actualización idempotente** de ítems existentes
- ✅ **Prevención de duplicados** basada en entidad + mes
- ✅ **Protección de datos** - No sobreescribe Azure DevOps IDs existentes
- ✅ **Procesamiento por lote** - Múltiples ítems en una sola petición
- ✅ **Respuestas detalladas** - Estado individual por cada ítem procesado

## 🚀 Despliegue

### 1. Instalar dependencias

```bash
cd functions
npm install
```

### 2. Configurar Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 3. Desplegar las funciones

```bash
# Desde la raíz del proyecto
firebase deploy --only functions

# O desde la carpeta functions
npm run deploy
```

### 4. Probar localmente (Emulador)

```bash
# Iniciar emuladores
firebase emulators:start

# O desde functions/
npm run serve
```

La función estará disponible en: `http://localhost:5001/lifetracker-9e171/us-central1/billingItems`

## 📡 Endpoint

### POST /billingItems

Crea y/o actualiza ítems de facturación.

**URL de producción:**
```
https://us-central1-lifetracker-9e171.cloudfunctions.net/billingItems
```

**URL de emulador local:**
```
http://localhost:5001/lifetracker-9e171/us-central1/billingItems
```

## 📥 Request

### Headers
```
Content-Type: application/json
```

### Body

```json
{
  "items": [
    {
      "entity": "Ministerio de Salud",
      "month": "2025-01",
      "azureDevOpsId": "12345",
      "requestType": "Facturación mensual",
      "notes": "Solicitud enviada el 15 de enero",
      "amount": 150000
    },
    {
      "entity": "Ministerio de Educación",
      "month": "2025-01",
      "azureDevOpsId": "12346"
    }
  ],
  "userId": "user123"
}
```

### Campos del request

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `items` | Array | ✅ Sí | Lista de ítems a procesar |
| `items[].entity` | String | ✅ Sí | Nombre o código de la entidad gubernamental |
| `items[].month` | String | ✅ Sí | Mes en formato `YYYY-MM` (ej: `2025-01`) |
| `items[].azureDevOpsId` | String | ✅ Sí | ID del work item en Azure DevOps |
| `items[].requestType` | String | ❌ No | Tipo de solicitud (opcional) |
| `items[].notes` | String | ❌ No | Notas adicionales (opcional) |
| `items[].amount` | Number | ❌ No | Monto a facturar (opcional) |
| `userId` | String | ❌ No | ID del usuario (para filtrado multi-tenant) |

## 📤 Response

### Respuesta exitosa (200 OK)

```json
{
  "success": true,
  "totalItems": 2,
  "created": 1,
  "updated": 1,
  "unchanged": 0,
  "errors": 0,
  "results": [
    {
      "identifier": "Ministerio de Salud-2025-01",
      "entity": "Ministerio de Salud",
      "month": "2025-01",
      "status": "created",
      "itemId": "abc123xyz",
      "message": "Ítem creado exitosamente con Azure DevOps ID: 12345"
    },
    {
      "identifier": "Ministerio de Educación-2025-01",
      "entity": "Ministerio de Educación",
      "month": "2025-01",
      "status": "updated",
      "itemId": "def456uvw",
      "message": "Ítem actualizado: agregado Azure DevOps ID 12346"
    }
  ],
  "message": "Todos los ítems procesados exitosamente"
}
```

### Estados posibles por ítem

| Estado | Descripción |
|--------|-------------|
| `created` | Ítem creado exitosamente |
| `updated` | Ítem actualizado (se agregó Azure DevOps ID) |
| `unchanged` | Ítem sin cambios (ya tenía Azure DevOps ID) |
| `error` | Error al procesar el ítem |

### Respuesta con errores de validación (400 Bad Request)

```json
{
  "success": false,
  "totalItems": 0,
  "created": 0,
  "updated": 0,
  "unchanged": 0,
  "errors": 1,
  "results": [],
  "message": "Error de validación",
  "error": "El campo 'items' es requerido y debe ser un array"
}
```

### Respuesta con errores de procesamiento (200 OK)

```json
{
  "success": false,
  "totalItems": 2,
  "created": 1,
  "updated": 0,
  "unchanged": 0,
  "errors": 1,
  "results": [
    {
      "identifier": "Ministerio de Salud-2025-01",
      "entity": "Ministerio de Salud",
      "month": "2025-01",
      "status": "created",
      "itemId": "abc123xyz",
      "message": "Ítem creado exitosamente con Azure DevOps ID: 12345"
    },
    {
      "identifier": "Ministerio de Educación-invalid",
      "entity": "Ministerio de Educación",
      "month": "invalid",
      "status": "error",
      "message": "Error: formato de mes inválido (debe ser YYYY-MM)",
      "error": "Invalid month format: invalid"
    }
  ],
  "message": "1 ítem(s) con errores"
}
```

## 🔧 Ejemplos de uso

### cURL

```bash
# Crear un nuevo ítem
curl -X POST \
  https://us-central1-lifetracker-9e171.cloudfunctions.net/billingItems \
  -H 'Content-Type: application/json' \
  -d '{
    "items": [
      {
        "entity": "Ministerio de Salud",
        "month": "2025-01",
        "azureDevOpsId": "12345",
        "amount": 150000
      }
    ]
  }'
```

### Postman

1. **Method**: POST
2. **URL**: `https://us-central1-lifetracker-9e171.cloudfunctions.net/billingItems`
3. **Headers**:
   - `Content-Type: application/json`
4. **Body** (raw JSON):
```json
{
  "items": [
    {
      "entity": "Ministerio de Salud",
      "month": "2025-01",
      "azureDevOpsId": "12345"
    }
  ]
}
```

### n8n

**Nodo HTTP Request:**

- **Method**: POST
- **URL**: `https://us-central1-lifetracker-9e171.cloudfunctions.net/billingItems`
- **Authentication**: None (o configurar según necesidades)
- **Body Content Type**: JSON
- **Specify Body**: Using Fields Below
- **Body Parameters**:
  ```json
  {
    "items": [
      {
        "entity": "{{ $json.entity }}",
        "month": "{{ $json.month }}",
        "azureDevOpsId": "{{ $json.workItemId }}"
      }
    ]
  }
  ```

### JavaScript/TypeScript

```typescript
const response = await fetch(
  'https://us-central1-lifetracker-9e171.cloudfunctions.net/billingItems',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          entity: 'Ministerio de Salud',
          month: '2025-01',
          azureDevOpsId: '12345',
          amount: 150000,
        },
      ],
    }),
  }
);

const data = await response.json();
console.log(data);
```

### Python

```python
import requests

url = "https://us-central1-lifetracker-9e171.cloudfunctions.net/billingItems"
payload = {
    "items": [
        {
            "entity": "Ministerio de Salud",
            "month": "2025-01",
            "azureDevOpsId": "12345",
            "amount": 150000
        }
    ]
}

response = requests.post(url, json=payload)
print(response.json())
```

## 🎯 Casos de uso

### 1. Crear nuevo ítem desde Azure DevOps webhook

Cuando se crea un work item en Azure DevOps, n8n puede llamar al API para registrarlo en Life Tracker:

```json
{
  "items": [
    {
      "entity": "{{ workItem.fields['Custom.Entity'] }}",
      "month": "{{ workItem.fields['Custom.BillingMonth'] }}",
      "azureDevOpsId": "{{ workItem.id }}",
      "requestType": "{{ workItem.fields['System.WorkItemType'] }}",
      "notes": "{{ workItem.fields['System.Title'] }}"
    }
  ]
}
```

### 2. Actualizar múltiples entidades para el mismo mes

```json
{
  "items": [
    {
      "entity": "Ministerio de Salud",
      "month": "2025-01",
      "azureDevOpsId": "12345"
    },
    {
      "entity": "Ministerio de Educación",
      "month": "2025-01",
      "azureDevOpsId": "12345"
    },
    {
      "entity": "Ministerio de Hacienda",
      "month": "2025-01",
      "azureDevOpsId": "12345"
    }
  ]
}
```

### 3. Idempotencia - Llamadas repetidas no duplican

Si ejecutas el mismo request 3 veces:
- **1ª llamada**: Crea el ítem → Status: `created`
- **2ª llamada**: Ítem ya existe con Azure DevOps ID → Status: `unchanged`
- **3ª llamada**: Ítem ya existe con Azure DevOps ID → Status: `unchanged`

## 🔐 Seguridad y reglas de Firestore

La colección `billing-items` en Firestore debe tener reglas de seguridad configuradas. Ver archivo `firestore.rules` para las reglas recomendadas.

Para desplegar las reglas:

```bash
firebase deploy --only firestore:rules
```

## 📊 Estructura de datos en Firestore

### Colección: `billing-items`

```typescript
{
  id: string;                    // ID del documento (generado automáticamente)
  entity: string;                // Entidad gubernamental
  month: string;                 // Formato: YYYY-MM
  azureDevOpsId?: string;        // ID del work item en Azure DevOps
  status: string;                // pending | in_azure_devops | completed | cancelled
  requestType?: string;          // Tipo de solicitud
  notes?: string;                // Notas adicionales
  amount?: number;               // Monto a facturar
  createdAt: string;             // Timestamp ISO 8601
  updatedAt: string;             // Timestamp ISO 8601
  userId?: string;               // ID del usuario (para multi-tenant)
}
```

### Índices recomendados

Crear índices compuestos en Firestore:

1. **entity + month** (para búsquedas rápidas)
2. **userId + month** (si usas multi-tenant)
3. **status + month** (para reportes)

## 🐛 Troubleshooting

### Error: "Method not allowed"
- Verifica que estés usando **POST**, no GET

### Error: "Invalid month format"
- El formato debe ser exactamente `YYYY-MM` (ejemplo: `2025-01`, no `2025-1`)

### Error: "Field 'items' is required"
- Asegúrate de enviar el campo `items` como un array en el body

### La función no responde
- Verifica que las funciones estén desplegadas: `firebase functions:list`
- Revisa los logs: `firebase functions:log`

### Error de permisos en Firestore
- Verifica que las reglas de Firestore estén configuradas correctamente
- Asegúrate de que el `userId` coincida con el usuario autenticado (si aplica)

## 📈 Monitoreo

### Ver logs en tiempo real
```bash
firebase functions:log --only billingItems
```

### Ver métricas en Firebase Console
1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Seleccionar proyecto: `lifetracker-9e171`
3. Functions → billingItems → Ver métricas

## 🧪 Testing

### Healthcheck (GET)
```bash
curl https://us-central1-lifetracker-9e171.cloudfunctions.net/billingItems
```

Respuesta esperada:
```json
{
  "status": "ok",
  "message": "API de Billing Items - Life Tracker",
  "version": "1.0.0",
  "endpoints": {
    "POST /billingItems": "Crear y/o actualizar ítems de facturación"
  }
}
```

## 📝 Notas adicionales

- **Límite de tamaño**: Firebase Functions tiene un límite de 10MB para el payload
- **Timeout**: Las funciones tienen un timeout de 60 segundos por defecto
- **Región**: Por defecto se despliega en `us-central1`
- **Costos**: Revisar [precios de Firebase Functions](https://firebase.google.com/pricing)

## 🔄 Actualización de código

Para actualizar la función después de hacer cambios:

```bash
cd functions
npm run build
firebase deploy --only functions:billingItems
```

## 📞 Soporte

Para reportar problemas o sugerencias, crear un issue en el repositorio del proyecto.
