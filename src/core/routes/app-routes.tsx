import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import AppLayout from '@/shared/layouts/AppLayout';
import { paths } from '@/core/routes/paths';
import LoginPage from '@/modules/auth/LoginPage';
import HabitRunPage from '@/modules/habit/HabitRunPage';
import ShoppingRunPage from '@/modules/shopping-list/ShoppingRunPage';
import { homeRoutes } from '@/modules/home/routes';

import { habitRoutes } from '@/modules/habit/routes';
import { taskRoutes } from '@/modules/task/routes';
import { moodRoutes } from '@/modules/mood/routes';
import { exerciseRoutes } from '@/modules/exercise/routes';
import { waterRoutes } from '@/modules/water/routes';
import { journalRoutes } from '@/modules/journal/routes';
import { mealRoutes } from '@/modules/meal/routes';
import { shoppingListRoutes } from '@/modules/shopping-list/routes';
import { recipeRoutes } from '@/modules/recipe/routes';
import { preparedMealsRoutes } from '@/modules/prepared-meals/routes';
import { negativeHabitRoutes } from '@/modules/negative-habits/routes';
import { pomodoroRoutes } from '@/modules/pomodoro/routes';
import { goalsRoutes } from '@/modules/goals/routes';
import { statisticsRoutes } from '@/modules/statistics/routes';
import { settingsRoutes } from '@/modules/settings/routes';
import { relationshipsRoutes } from '@/modules/relationships/routes';

const moduleRegistries = [
  homeRoutes,
  habitRoutes,
  taskRoutes,
  moodRoutes,
  exerciseRoutes,
  waterRoutes,
  journalRoutes,
  mealRoutes,
  shoppingListRoutes,
  recipeRoutes,
  preparedMealsRoutes,
  negativeHabitRoutes,
  pomodoroRoutes,
  goalsRoutes,
  statisticsRoutes,
  settingsRoutes,
  relationshipsRoutes
];

const appChildrenRoutes: RouteObject[] = [
  ...moduleRegistries.flatMap((registry) => registry.moduleRoutes),
  ...moduleRegistries.flatMap((registry) => registry.legacyRedirects || []),
  { path: '*', element: <Navigate to={paths.home} replace /> }
];

const globalAuthenticatedRoutes: RouteObject[] = [
  { path: 'habit/:habitId/run', element: <HabitRunPage /> },
  { path: 'shopping/run', element: <ShoppingRunPage /> }
];

export const getAppRoutes = (isAuthenticated: boolean): RouteObject[] => {
  if (!isAuthenticated) {
    return [
      { path: paths.auth.login, element: <LoginPage /> },
      { path: '*', element: <LoginPage /> }
    ];
  }

  return [
    { path: '/', element: <AppLayout />, children: appChildrenRoutes },
    ...globalAuthenticatedRoutes,
    { path: '*', element: <Navigate to={paths.home} replace /> }
  ];
};
