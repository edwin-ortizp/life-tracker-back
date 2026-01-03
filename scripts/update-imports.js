/**
 * Script para actualizar imports de hooks de Firebase a Supabase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapeo de hooks a actualizar
const HOOK_MAPPINGS = [
  { from: '/useTaskData', to: '/useTaskData.supabase' },
  { from: '/useShoppingList', to: '/useShoppingList.supabase' },
  { from: '/useHabitData\'', to: '/useHabitData.supabase\'' },
  { from: '/useHabitData"', to: '/useHabitData.supabase"' },
  { from: '/useHabitDataDaily', to: '/useHabitDataDaily.supabase' },
  { from: '/useHabitCalendar', to: '/useHabitCalendar.supabase' },
  { from: '/useMealPlan', to: '/useMealPlan.supabase' },
  { from: '/useMoodData', to: '/useMoodData.supabase' },
  { from: '/useEnergyData', to: '/useEnergyData.supabase' },
  { from: '/useWaterData', to: '/useWaterData.supabase' },
  { from: '/useExerciseData', to: '/useExerciseData.supabase' },
  { from: '/usePomodoroData', to: '/usePomodoroData.supabase' },
  { from: '/useJournalData', to: '/useJournalData.supabase' },
  { from: '/useNegativeHabitData', to: '/useNegativeHabitData.supabase' },
  { from: '/useGoals', to: '/useGoals.supabase' },
  { from: '/useRecipes', to: '/useRecipes.supabase' },
  { from: '/usePreparedMeals', to: '/usePreparedMeals.supabase' }
];

// Archivos a actualizar (de la salida de grep)
const FILES_TO_UPDATE = [
  'src/components/AppFooter.tsx',
  'src/components/widgets/DailyHabitsChecklist.tsx',
  'src/components/widgets/DailyScore.tsx',
  'src/components/widgets/DaySummary.tsx',
  'src/components/widgets/QuickAccessEnergy.tsx',
  'src/components/widgets/QuickAccessExercise.tsx',
  'src/components/widgets/QuickAccessHabits.tsx',
  'src/components/widgets/QuickAccessJournal.tsx',
  'src/components/widgets/QuickAccessMood.tsx',
  'src/components/widgets/QuickAccessPomodoro.tsx',
  'src/components/widgets/QuickAccessTasks.tsx',
  'src/components/widgets/QuickAccessWater.tsx',
  'src/features/meal/components/index.tsx',
  'src/features/meal/components/MealExportWizard.tsx',
  'src/features/meal/components/WeeklyView/MealAiButtons.tsx',
  'src/features/task/components/TasksTodayCalendar.tsx',
  'src/hooks/useGlobalPomodoroTimer.ts',
  'src/pages/HabitRunPage.tsx',
  'src/pages/JournalPage.tsx',
  'src/pages/SettingsPage.tsx',
  'src/pages/ShoppingRunPage.tsx',
  'src/pages/StatisticsPage.tsx',
  'src/pages/TaskCalendarPage.tsx',
  'src/pages/TaskPage.tsx',
  'src/pages/TaskRunPage.tsx',
  'src/features/exercise/components/index.tsx',
  'src/features/goals/components/index.tsx',
  'src/features/habit/components/index.tsx',
  'src/features/journal/components/index.tsx',
  'src/features/mood/components/index.tsx',
  'src/features/pomodoro/components/Pomodoro.tsx',
  'src/features/prepared-meals/components/index.tsx',
  'src/features/recipe/components/index.tsx',
  'src/features/recipe/components/RecipeExportWizard.tsx',
  'src/features/shopping-list/components/index.tsx',
  'src/features/shopping-list/components/ShoppingExportWizard.tsx',
  'src/features/task/components/index.tsx',
  'src/features/task/components/TaskKanbanView.tsx',
  'src/features/task/components/TaskWeekView.tsx',
  'src/features/task/components/PrivateTaskSection.tsx',
  'src/features/water/components/index.tsx',
  'src/pages/NegativeHabitsPage.tsx',
  'src/features/prepared-meals/index.ts',
  'src/features/pomodoro/hooks/index.ts'
];

function updateFile(filePath) {
  const fullPath = path.join(path.dirname(__dirname), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let updated = false;

  // Aplicar cada mapeo
  HOOK_MAPPINGS.forEach(({ from, to }) => {
    const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (regex.test(content)) {
      content = content.replace(regex, to);
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    return true;
  } else {
    console.log(`⏭️  No changes: ${filePath}`);
    return false;
  }
}

function main() {
  console.log('🚀 Starting import updates...\n');

  let updatedCount = 0;
  let skippedCount = 0;

  FILES_TO_UPDATE.forEach(file => {
    if (updateFile(file)) {
      updatedCount++;
    } else {
      skippedCount++;
    }
  });

  console.log('\n📊 Summary:');
  console.log(`✅ Updated: ${updatedCount} files`);
  console.log(`⏭️  Skipped: ${skippedCount} files`);
  console.log(`📁 Total: ${FILES_TO_UPDATE.length} files processed`);
}

main();
