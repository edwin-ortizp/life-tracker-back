# Formato JSON para Plan de Comidas

Este documento describe el formato esperado para importar planes de comida semanales.

## Estructura del JSON

```json
{
  "2025-01-20": {
    "breakfast": {
      "name": "Avena con frutas",
      "notes": "Agregar miel"
    },
    "lunch": {
      "name": "Ensalada César",
      "notes": "Con pollo a la plancha"
    },
    "dinner": {
      "name": "Sopa de verduras",
      "notes": "Versión ligera"
    }
  }
}
```

## Reglas de Formato

1. Las fechas deben estar en formato ISO: "YYYY-MM-DD"
2. Los tipos de comida válidos son:
   - breakfast (Desayuno)
   - lunch (Almuerzo)
   - dinner (Cena)
3. Cada comida debe tener:
   - name (obligatorio): String con el nombre de la comida
   - notes (opcional): String con notas adicionales

## Instrucciones para IAs

Al generar el JSON:

1. Respetar los tipos de comida establecidos (breakfast, lunch, dinner)
2. Asegurarse que las fechas correspondan a la semana solicitada
3. Las comidas deben ser coherentes con el tipo (desayunos apropiados para la mañana, etc.)
4. Los nombres de las comidas deben estar en español
5. Las notas son opcionales pero deben ser relevantes cuando se incluyan
6. Evitar comidas repetidas en días consecutivos
7. Considerar una dieta balanceada al generar el plan semanal

## Ejemplo de Solicitud

"Genera un plan de comidas saludable para la semana del 20 al 26 de enero de 2025"

## Validación

El JSON generado debe:
- Tener fechas válidas
- Incluir solo los tipos de comida permitidos
- Tener nombres de comida para cada entrada
- Seguir la estructura anidada correcta