import { Navigate } from 'react-router-dom';
import type { ModuleRouteRegistry } from '@/core/routes/types';
import { paths } from '@/core/routes/paths';
import RecipesPage from '@/modules/recipe/RecipesPage';
import RecipesConfigPage from '@/modules/recipe/RecipesConfigPage';
import RecipeDetailPage from '@/modules/recipe/RecipeDetailPage';

export const recipeRoutes: ModuleRouteRegistry = {
  module: 'recipe',
  defaultRoute: paths.recipes.view(paths.recipes.defaultView),
  moduleRoutes: [
    { path: 'recipes', element: <Navigate to={paths.recipes.view(paths.recipes.defaultView)} replace /> },
    { path: 'recipes/view/:viewKey', element: <RecipesPage /> },
    { path: 'recipes/config', element: <RecipesConfigPage /> },
    { path: 'recipes/:recipeId', element: <RecipeDetailPage /> }
  ]
};
