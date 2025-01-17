src/
└── features/
    └── pomodoro/
        ├── components/
        │   ├── DailyStats.tsx         # Estadísticas diarias
        │   ├── PomodoroCounter.tsx    # Componente del contador +/-
        │   ├── PomodoroHistory.tsx    # Lista de sesiones del día
        │   ├── PomodoroProgress.tsx   # Barra de progreso
        │   ├── PomodoroStats.tsx      # Estadísticas
        │   ├── PomodoroTimer.tsx      # Timer y botones de control
        │   ├── PomodoroEditModal.tsx  # Modal para editar los Pomodoro
        │   ├── Pomodoro.tsx           # 
        │   └── index.tsx              # Componente principal Pomodoro
        │
        ├── hooks/
        │   ├── usePomodoroTimer.ts    # Lógica del temporizador
        │   ├── usePomodoroData.ts     # Lógica de datos/Firebase
        │   └── index.ts               # Exportaciones de hooks
        │
        ├── types/
        │   └── index.ts               # Tipos e interfaces
        │
        └── utils/
            └── formatTime.ts          # Funciones auxiliares