export const paths = {
  auth: {
    login: '/login'
  },
  home: '/',
  settings: '/settings',
  goals: {
    base: '/goals',
    detail: (goalId: string) => `/goals/${goalId}`
  },
  stats: {
    home: '/stats'
  },
  habit: {
    base: '/habit',
    defaultView: 'tracker',
    view: (viewKey: string) => `/habit/view/${viewKey}`,
    config: '/habit/config',
    run: (habitId: string) => `/habit/${habitId}/run`
  },
  task: {
    base: '/task',
    defaultView: 'list',
    view: (viewKey: string) => `/task/view/${viewKey}`,
    config: '/task/config',
    run: (taskId: string) => `/task/${taskId}/run`,
    legacy: {
      list: '/task/list',
      kanban: '/task/kanban',
      calendar: '/task/calendar',
      tasksCalendar: '/tasks/calendar',
      kanbanRoot: '/kanban'
    }
  },
  mood: {
    base: '/mood',
    defaultView: 'tracker',
    view: (viewKey: string) => `/mood/view/${viewKey}`,
    config: '/mood/config'
  },
  pomodoro: {
    base: '/pomodoro',
    defaultView: 'timer',
    view: (viewKey: string) => `/pomodoro/view/${viewKey}`,
    config: '/pomodoro/config'
  },
  exercise: {
    base: '/exercise',
    defaultView: 'daily',
    view: (viewKey: string) => `/exercise/view/${viewKey}`,
    config: '/exercise/config'
  },
  water: {
    base: '/water',
    defaultView: 'daily',
    view: (viewKey: string) => `/water/view/${viewKey}`,
    config: '/water/config'
  },
  journal: {
    base: '/journal',
    defaultView: 'entries',
    view: (viewKey: string) => `/journal/view/${viewKey}`,
    config: '/journal/config'
  },
  negativeHabits: {
    base: '/negative',
    defaultView: 'weekly',
    view: (viewKey: string) => `/negative/view/${viewKey}`,
    config: '/negative/config'
  },
  meal: {
    base: '/meal',
    defaultView: 'weekly',
    view: (viewKey: string) => `/meal/view/${viewKey}`,
    config: '/meal/config'
  },
  shoppingList: {
    base: '/shopping-list',
    defaultView: 'list',
    view: (viewKey: string) => `/shopping-list/view/${viewKey}`,
    config: '/shopping-list/config',
    run: '/shopping/run',
    legacy: {
      list: '/shopping-list/list',
      kanban: '/shopping-list/kanban'
    }
  },
  recipes: {
    base: '/recipes',
    defaultView: 'list',
    view: (viewKey: string) => `/recipes/view/${viewKey}`,
    config: '/recipes/config',
    detail: (recipeId: string) => `/recipes/${recipeId}`
  },
  preparedMeals: {
    base: '/prepared-meals',
    defaultView: 'list',
    view: (viewKey: string) => `/prepared-meals/view/${viewKey}`,
    config: '/prepared-meals/config'
  }
} as const;
