# Guía de Importación de Tareas con Fechas

## ✨ Nueva Funcionalidad

Ahora puedes importar tareas con fechas específicas tanto en las tareas generales como en las tareas privadas.

## 📅 Formatos de Fecha Soportados

### 1. Solo Fecha (YYYY-MM-DD)
```json
{
  "title": "Reunión importante",
  "dueDate": "2024-12-31"
}
```

### 2. Fecha y Hora ISO (formato UTC)
```json
{
  "title": "Llamada con cliente",
  "dueDate": "2024-06-15T14:30:00Z"
}
```

### 3. Fecha y Hora Local
```json
{
  "title": "Presentación",
  "dueDate": "2024-06-15T14:30:00"
}
```

### 4. Sin Fecha (opcional)
```json
{
  "title": "Tarea sin fecha límite"
  // No incluir el campo dueDate
}
```

## 📋 Ejemplo Completo de Importación

```json
[
  {
    "title": "Completar proyecto Q4",
    "description": "Finalizar todas las funcionalidades pendientes",
    "dueDate": "2024-12-31",
    "category": "work",
    "priority": "do",
    "size": "grande",
    "isRecurrent": false
  },
  {
    "title": "Revisión médica anual",
    "description": "Chequeo general de salud",
    "dueDate": "2024-07-15T09:00:00Z",
    "category": "health",
    "priority": "decide",
    "size": "mediana"
  },
  {
    "title": "Leer libro recomendado",
    "description": "Libro sobre productividad",
    "category": "personal",
    "priority": "delegate",
    "size": "pequeña"
  },
  {
    "title": "Ejercicio matutino",
    "description": "30 minutos de ejercicio",
    "dueDate": "2024-06-06",
    "category": "health",
    "isRecurrent": true
  }
]
```

## 🏠 Campos Disponibles

### Campos Obligatorios
- `title`: Título de la tarea (string)

### Campos Opcionales
- `description`: Descripción detallada (string)
- `dueDate`: Fecha límite (string en formato ISO)
- `category`: Categoría de la tarea
  - Opciones: `personal`, `work`, `home`, `health`, `shopping`, `study`, `social`, `other`
  - Por defecto: `personal`
- `priority`: Prioridad según matriz de Eisenhower
  - Opciones: `do`, `decide`, `delegate`, `delete`
- `size`: Tamaño estimado de la tarea
  - Opciones: `pequeña`, `mediana`, `grande`
- `isRecurrent`: Si la tarea es recurrente (boolean)
  - Por defecto: `false`

## 🔒 Tareas Privadas vs Generales

### Tareas Generales
- Se importan desde el botón "Importar" en la sección principal de tareas
- Son visibles para todos los usuarios autorizados
- Se almacenan como `isPrivate: false`

### Tareas Privadas
- Se importan desde la sección "🔒 Tareas Privadas"
- Solo son visibles para el usuario que las creó
- Se almacenan automáticamente como `isPrivate: true`

## ⚠️ Manejo de Errores

### Fechas Inválidas
- Si una fecha no se puede parsear, se mostrará una advertencia
- La tarea se importará sin fecha
- El contador de errores se incluirá en el mensaje de confirmación

### Formato JSON Inválido
- Se mostrará un error si el JSON no es válido
- Verifica que uses comillas dobles para las cadenas
- Asegúrate de que los corchetes y llaves estén balanceados

## 📤 Exportación

### Lo que se incluye en la exportación:
- Todos los campos de la tarea
- Fechas en formato ISO completo
- Información de recurrencia (si aplica)
- Configuración de prioridad y tamaño

### Usar la exportación:
1. Haz clic en "Exportar"
2. Los datos se copian automáticamente al portapapeles
3. Pega el contenido en un archivo `.json` o úsalo para importar en otro lugar

## 💡 Consejos

1. **Prueba con pocas tareas primero**: Importa 1-2 tareas para verificar el formato
2. **Usa un validador JSON**: Verifica tu JSON en jsonlint.com antes de importar
3. **Revisa las fechas**: Asegúrate de que las fechas estén en el formato correcto
4. **Aprovecha la exportación**: Usa la función de exportar para ver el formato exacto
