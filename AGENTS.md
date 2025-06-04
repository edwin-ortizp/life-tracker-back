# Instrucciones para Codex

Este proyecto es una aplicación web construida con **React**, **Vite** y **TypeScript**. Los módulos principales viven en `src/features` y los componentes reutilizables en `src/components/ui`.

## Reglas para los PR

1. Ejecuta `npm run lint` y `npm run build` antes de enviar cambios.
2. Coloca la salida de estos comandos en la sección **Testing** del PR.
3. Si algún comando falla por falta de dependencias o limitaciones del entorno, escribe lo siguiente:
   'Codex couldn't run certain commands due to environnment limitations. Consider configuring a setup script or internet access in your Codex environment to install dependencies.'
4. Mantén mensajes de commit claros y descriptivos.

## Estructura básica del proyecto

```
src/
├── features/        # módulos como hábitos, pomodoro, tareas, etc.
├── components/ui/   # componentes de interfaz reutilizables
├── utils/           # utilidades globales
└── hooks/           # hooks globales
```
