# API de Facturación - Guía Rápida

## 🚀 Inicio Rápido

### 1. Instalar dependencias de Firebase Functions

```bash
npm run functions:install
```

### 2. Compilar las funciones

```bash
npm run functions:build
```

### 3. Probar localmente con emuladores

```bash
npm run functions:serve
```

La API estará disponible en: `http://localhost:5001/lifetracker-9e171/us-central1/billingItems`

### 4. Desplegar a producción

```bash
npm run functions:deploy
```

## 📡 Endpoint de Producción

```
POST https://us-central1-lifetracker-9e171.cloudfunctions.net/billingItems
```

## 📝 Ejemplo de uso con cURL

```bash
curl -X POST \
  http://localhost:5001/lifetracker-9e171/us-central1/billingItems \
  -H 'Content-Type: application/json' \
  -d '{
    "items": [
      {
        "entity": "Ministerio de Salud",
        "month": "2025-01",
        "azureDevOpsId": "12345",
        "requestType": "Facturación mensual",
        "amount": 150000,
        "notes": "Solicitud de enero 2025"
      }
    ]
  }'
```

## 📚 Documentación Completa

Ver documentación detallada en: [functions/README.md](./functions/README.md)

## 🔧 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run functions:install` | Instalar dependencias de las funciones |
| `npm run functions:build` | Compilar TypeScript a JavaScript |
| `npm run functions:serve` | Ejecutar emuladores locales |
| `npm run functions:deploy` | Desplegar a Firebase |
| `npm run functions:logs` | Ver logs en tiempo real |

## 📊 Estructura de Datos

### Request

```typescript
{
  items: [
    {
      entity: string;           // Requerido
      month: string;            // Requerido (formato: YYYY-MM)
      azureDevOpsId: string;    // Requerido
      requestType?: string;     // Opcional
      notes?: string;           // Opcional
      amount?: number;          // Opcional
    }
  ],
  userId?: string;              // Opcional
}
```

### Response

```typescript
{
  success: boolean;
  totalItems: number;
  created: number;
  updated: number;
  unchanged: number;
  errors: number;
  results: [
    {
      identifier: string;       // "entidad-mes"
      entity: string;
      month: string;
      status: "created" | "updated" | "unchanged" | "error";
      itemId?: string;
      message: string;
      error?: string;
    }
  ];
  message?: string;
}
```

## 🎯 Casos de Uso

### Crear nuevo ítem de facturación

```json
{
  "items": [
    {
      "entity": "Ministerio de Educación",
      "month": "2025-01",
      "azureDevOpsId": "ADO-123"
    }
  ]
}
```

### Actualizar múltiples ítems en batch

```json
{
  "items": [
    {
      "entity": "Ministerio de Salud",
      "month": "2025-01",
      "azureDevOpsId": "ADO-456"
    },
    {
      "entity": "Ministerio de Hacienda",
      "month": "2025-01",
      "azureDevOpsId": "ADO-457"
    },
    {
      "entity": "Ministerio de Trabajo",
      "month": "2025-01",
      "azureDevOpsId": "ADO-458"
    }
  ]
}
```

## 🔐 Seguridad

- Las reglas de Firestore están configuradas para proteger los datos
- Cada usuario solo puede acceder a sus propios ítems
- El API valida todos los datos antes de procesarlos

## 🐛 Troubleshooting

### Error: "Method not allowed"
➡️ Usa POST, no GET

### Error: "Invalid month format"
➡️ El mes debe estar en formato `YYYY-MM` (ejemplo: `2025-01`)

### Error: Firebase CLI no encontrado
➡️ Instala Firebase CLI: `npm install -g firebase-tools`

### La función no responde
➡️ Verifica logs: `npm run functions:logs`

## 📞 Más Información

- [Documentación completa de la API](./functions/README.md)
- [Tipos TypeScript](./functions/src/types.ts)
- [Lógica de negocio](./functions/src/billingService.ts)
- [Validaciones](./functions/src/validation.ts)
