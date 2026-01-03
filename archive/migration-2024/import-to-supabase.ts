/**
 * Script de Importación: JSON → Supabase
 *
 * Importa data exportada de Firebase a Supabase PostgreSQL
 * con transformación de estructura denormalizada → normalizada
 *
 * Uso:
 *   npx tsx scripts/import-to-supabase.ts [archivo-export.json]
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Faltan credenciales de Supabase en .env');
  console.error('   VITE_SUPABASE_URL y SUPABASE_SERVICE_KEY son requeridos');
  process.exit(1);
}

// Cliente Supabase con service role (bypass RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface ExportData {
  [collection: string]: any[];
}

interface ImportStats {
  collection: string;
  imported: number;
  errors: number;
}

/**
 * Helper: Obtener el primer user_id del export (asumimos un solo usuario por ahora)
 */
function getDefaultUserId(exportData: ExportData): string | null {
  // Buscar en tasks el primer userId
  const tasks = exportData.tasks || [];
  if (tasks.length > 0 && tasks[0].userId) {
    return tasks[0].userId;
  }

  // Buscar en otras colecciones
  for (const collection of Object.values(exportData)) {
    if (collection.length > 0 && collection[0].userId) {
      return collection[0].userId;
    }
  }

  return null;
}

/**
 * 1. Importar Tasks
 */
async function importTasks(tasks: any[], userId: string): Promise<ImportStats> {
  console.log('\n📦 Importando Tasks...');
  const stats: ImportStats = { collection: 'tasks', imported: 0, errors: 0 };

  for (const task of tasks) {
    try {
      const { error } = await supabase.from('tasks').insert({
        id: task.id,
        user_id: userId,
        task_code: task.taskCode,
        title: task.title,
        description: task.description,
        completed: task.completed || false,
        category: task.category,
        priority: task.priority,
        size: task.size,
        start_date: task.startDate,
        end_date: task.endDate,
        is_recurrent: task.isRecurrent || false,
        is_private: task.isPrivate || false,
        recurrence: task.recurrence,
        progress: task.progress || 0,
        elapsed_seconds: task.elapsedSeconds || 0,
        timer_start_time: task.timerStartTime,
        timer_paused: task.timerPaused || false,
        paused_duration: task.pausedDuration || 0,
        timer_active: task.timerActive || false,
        estimated_time: task.estimatedTime,
        created_at: task.createdAt,
        updated_at: task.updatedAt
      });

      if (error) throw error;
      stats.imported++;
    } catch (err: any) {
      console.error(`   ✗ Error importando task ${task.id}:`, err.message);
      stats.errors++;
    }
  }

  console.log(`   ✓ ${stats.imported} tasks importadas (${stats.errors} errores)`);
  return stats;
}

/**
 * 2. Importar Goals (con normalización)
 */
async function importGoals(goals: any[], userId: string): Promise<ImportStats> {
  console.log('\n📦 Importando Goals...');
  const stats: ImportStats = { collection: 'goals', imported: 0, errors: 0 };

  for (const goal of goals) {
    try {
      // Insertar goal principal
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .insert({
          id: goal.id,
          user_id: userId,
          title: goal.title,
          description: goal.description,
          status: goal.status || 'active',
          start_date: goal.startDate,
          due_date: goal.dueDate,
          positive_count: goal.positiveCount || 0,
          negative_count: goal.negativeCount || 0,
          numeric_goal: goal.numericGoal,
          created_at: goal.createdAt,
          updated_at: goal.updatedAt
        })
        .select()
        .single();

      if (goalError) throw goalError;

      // Insertar goal_tasks
      if (goal.tasks?.length) {
        const goalTasks = goal.tasks.map((t: any) => ({
          goal_id: goalData.id,
          title: t.title,
          done: t.done || false,
          created_at: t.createdAt,
          completed_at: t.completedAt
        }));

        const { error: tasksError } = await supabase
          .from('goal_tasks')
          .insert(goalTasks);

        if (tasksError) console.error(`   ⚠️ Error importando tasks del goal ${goal.id}`);
      }

      // Insertar goal_entries
      if (goal.entries?.length) {
        const goalEntries = goal.entries.map((e: any) => ({
          goal_id: goalData.id,
          text: e.text,
          date: e.date,
          is_milestone: e.isMilestone || false
        }));

        const { error: entriesError } = await supabase
          .from('goal_entries')
          .insert(goalEntries);

        if (entriesError) console.error(`   ⚠️ Error importando entries del goal ${goal.id}`);
      }

      // Insertar goal_numeric_entries
      if (goal.numericEntries?.length) {
        const numericEntries = goal.numericEntries.map((ne: any) => ({
          goal_id: goalData.id,
          value: ne.value,
          date: ne.date,
          note: ne.note
        }));

        const { error: numericError } = await supabase
          .from('goal_numeric_entries')
          .insert(numericEntries);

        if (numericError) console.error(`   ⚠️ Error importando numeric entries del goal ${goal.id}`);
      }

      stats.imported++;
    } catch (err: any) {
      console.error(`   ✗ Error importando goal ${goal.id}:`, err.message);
      stats.errors++;
    }
  }

  console.log(`   ✓ ${stats.imported} goals importados (${stats.errors} errores)`);
  return stats;
}

/**
 * 3. Importar Habits (transformar de formato mensual a registros individuales)
 */
async function importHabits(habits: any[], userId: string): Promise<ImportStats> {
  console.log('\n📦 Importando Habits...');
  const stats: ImportStats = { collection: 'habits', imported: 0, errors: 0 };

  const completions: any[] = [];

  for (const doc of habits) {
    try {
      // Formato Firebase: doc.id = "userId_YYYY-MM"
      // doc.habits = { "habitId_YYYY-MM-DD": true/false }
      const habitsData = doc.habits || {};

      for (const [key, completed] of Object.entries(habitsData)) {
        const [habitIdStr, dateStr] = key.split('_');
        const habitId = parseInt(habitIdStr);

        if (!isNaN(habitId) && dateStr) {
          completions.push({
            user_id: userId,
            habit_id: habitId,
            date: dateStr,
            completed: completed as boolean
          });
        }
      }
    } catch (err: any) {
      console.error(`   ✗ Error procesando habit doc ${doc.id}:`, err.message);
      stats.errors++;
    }
  }

  // Insertar en batch
  if (completions.length > 0) {
    // Supabase tiene límite de ~1000 filas por insert, dividir en chunks
    const chunkSize = 500;
    for (let i = 0; i < completions.length; i += chunkSize) {
      const chunk = completions.slice(i, i + chunkSize);
      const { error } = await supabase.from('habit_completions').insert(chunk);

      if (error) {
        console.error(`   ✗ Error insertando chunk de habits:`, error.message);
        stats.errors++;
      } else {
        stats.imported += chunk.length;
      }
    }
  }

  console.log(`   ✓ ${stats.imported} habit completions importados (${stats.errors} errores)`);
  return stats;
}

/**
 * 4. Importar Moods (transformar de array en documento a registros individuales)
 */
async function importMoods(moods: any[], userId: string): Promise<ImportStats> {
  console.log('\n📦 Importando Moods...');
  const stats: ImportStats = { collection: 'moods', imported: 0, errors: 0 };

  const moodEntries: any[] = [];

  for (const doc of moods) {
    try {
      // Formato Firebase: doc.id = "userId_YYYY-MM-DD"
      // doc.moods = [{emoji, text, value, time, timestamp}]
      const [_, date] = doc.id.split('_');

      for (const mood of doc.moods || []) {
        moodEntries.push({
          user_id: userId,
          date: date,
          emoji: mood.emoji,
          text: mood.text,
          value: mood.value,
          time: mood.time,
          timestamp: mood.timestamp
        });
      }
    } catch (err: any) {
      console.error(`   ✗ Error procesando mood doc ${doc.id}:`, err.message);
      stats.errors++;
    }
  }

  // Insertar en batch
  if (moodEntries.length > 0) {
    const chunkSize = 500;
    for (let i = 0; i < moodEntries.length; i += chunkSize) {
      const chunk = moodEntries.slice(i, i + chunkSize);
      const { error } = await supabase.from('mood_entries').insert(chunk);

      if (error) {
        console.error(`   ✗ Error insertando chunk de moods:`, error.message);
        stats.errors++;
      } else {
        stats.imported += chunk.length;
      }
    }
  }

  console.log(`   ✓ ${stats.imported} mood entries importados (${stats.errors} errores)`);
  return stats;
}

/**
 * 5. Importar Energy
 */
async function importEnergy(energy: any[], userId: string): Promise<ImportStats> {
  console.log('\n📦 Importando Energy...');
  const stats: ImportStats = { collection: 'energy', imported: 0, errors: 0 };

  const energyEntries: any[] = [];

  for (const doc of energy) {
    try {
      const [_, date] = doc.id.split('_');

      for (const entry of doc.energyLevels || []) {
        energyEntries.push({
          user_id: userId,
          date: date,
          level: entry.level,
          time: entry.time,
          timestamp: entry.timestamp,
          comment: entry.comment
        });
      }
    } catch (err: any) {
      console.error(`   ✗ Error procesando energy doc ${doc.id}:`, err.message);
      stats.errors++;
    }
  }

  if (energyEntries.length > 0) {
    const { error } = await supabase.from('energy_entries').insert(energyEntries);
    if (error) {
      console.error(`   ✗ Error insertando energy:`, error.message);
      stats.errors++;
    } else {
      stats.imported = energyEntries.length;
    }
  }

  console.log(`   ✓ ${stats.imported} energy entries importados (${stats.errors} errores)`);
  return stats;
}

/**
 * 6. Importar Water
 */
async function importWater(water: any[], userId: string): Promise<ImportStats> {
  console.log('\n📦 Importando Water...');
  const stats: ImportStats = { collection: 'water', imported: 0, errors: 0 };

  const drinkLogs: any[] = [];

  for (const doc of water) {
    try {
      const [_, date] = doc.id.split('_');

      for (const drink of doc.drinks || []) {
        drinkLogs.push({
          user_id: userId,
          date: date,
          drink_type: drink.type,
          amount: drink.amount,
          hydration_value: drink.hydrationValue,
          time: drink.time,
          timestamp: drink.timestamp
        });
      }
    } catch (err: any) {
      console.error(`   ✗ Error procesando water doc ${doc.id}:`, err.message);
      stats.errors++;
    }
  }

  if (drinkLogs.length > 0) {
    const chunkSize = 500;
    for (let i = 0; i < drinkLogs.length; i += chunkSize) {
      const chunk = drinkLogs.slice(i, i + chunkSize);
      const { error } = await supabase.from('drink_logs').insert(chunk);

      if (error) {
        console.error(`   ✗ Error insertando chunk de drinks:`, error.message);
        stats.errors++;
      } else {
        stats.imported += chunk.length;
      }
    }
  }

  console.log(`   ✓ ${stats.imported} drink logs importados (${stats.errors} errores)`);
  return stats;
}

/**
 * 7. Importar Exercises
 */
async function importExercises(exercises: any[], userId: string): Promise<ImportStats> {
  console.log('\n📦 Importando Exercises...');
  const stats: ImportStats = { collection: 'exercises', imported: 0, errors: 0 };

  const exerciseLogs: any[] = [];

  for (const doc of exercises) {
    try {
      const [_, date] = doc.id.split('_');

      for (const exercise of doc.exercises || []) {
        exerciseLogs.push({
          user_id: userId,
          date: date,
          exercise_id: exercise.id,
          sets: exercise.sets,
          reps: exercise.reps,
          duration: exercise.duration,
          distance: exercise.distance,
          weight: exercise.weight,
          calories: exercise.calories,
          steps: exercise.steps,
          notes: exercise.notes
        });
      }
    } catch (err: any) {
      console.error(`   ✗ Error procesando exercise doc ${doc.id}:`, err.message);
      stats.errors++;
    }
  }

  if (exerciseLogs.length > 0) {
    const { error } = await supabase.from('exercise_logs').insert(exerciseLogs);
    if (error) {
      console.error(`   ✗ Error insertando exercises:`, error.message);
      stats.errors++;
    } else {
      stats.imported = exerciseLogs.length;
    }
  }

  console.log(`   ✓ ${stats.imported} exercise logs importados (${stats.errors} errores)`);
  return stats;
}

/**
 * 8. Importar Pomodoro
 */
async function importPomodoro(pomodoro: any[], userId: string): Promise<ImportStats> {
  console.log('\n📦 Importando Pomodoro...');
  const stats: ImportStats = { collection: 'pomodoro', imported: 0, errors: 0 };

  const sessions: any[] = [];

  for (const doc of pomodoro) {
    try {
      const [_, date] = doc.id.split('_');

      for (const session of doc.sessions || []) {
        sessions.push({
          user_id: userId,
          date: date,
          start_time: session.startTime,
          end_time: session.endTime,
          duration: session.duration,
          completed: session.completed || false,
          description: session.description
        });
      }
    } catch (err: any) {
      console.error(`   ✗ Error procesando pomodoro doc ${doc.id}:`, err.message);
      stats.errors++;
    }
  }

  if (sessions.length > 0) {
    const { error } = await supabase.from('pomodoro_sessions').insert(sessions);
    if (error) {
      console.error(`   ✗ Error insertando pomodoro:`, error.message);
      stats.errors++;
    } else {
      stats.imported = sessions.length;
    }
  }

  console.log(`   ✓ ${stats.imported} pomodoro sessions importados (${stats.errors} errores)`);
  return stats;
}

/**
 * 9. Importar Journal
 */
async function importJournal(journal: any[], userId: string): Promise<ImportStats> {
  console.log('\n📦 Importando Journal...');
  const stats: ImportStats = { collection: 'journal', imported: 0, errors: 0 };

  const entries: any[] = [];

  for (const doc of journal) {
    try {
      const [_, date] = doc.id.split('_');

      entries.push({
        user_id: userId,
        date: date,
        text: doc.text,
        display_time: doc.displayTime,
        updated_at: doc.updatedAt
      });
    } catch (err: any) {
      console.error(`   ✗ Error procesando journal doc ${doc.id}:`, err.message);
      stats.errors++;
    }
  }

  if (entries.length > 0) {
    const { error } = await supabase.from('journal_entries').insert(entries);
    if (error) {
      console.error(`   ✗ Error insertando journal:`, error.message);
      stats.errors++;
    } else {
      stats.imported = entries.length;
    }
  }

  console.log(`   ✓ ${stats.imported} journal entries importados (${stats.errors} errores)`);
  return stats;
}

/**
 * 10. Importar Negative Habits
 */
async function importNegativeHabits(negativeHabits: any[], userId: string): Promise<ImportStats> {
  console.log('\n📦 Importando Negative Habits...');
  const stats: ImportStats = { collection: 'negative-habits', imported: 0, errors: 0 };

  const logs: any[] = [];

  for (const doc of negativeHabits) {
    try {
      for (const [key, log] of Object.entries(doc.habits || {})) {
        const logData = log as any;
        logs.push({
          user_id: userId,
          habit_id: logData.habitId,
          timestamp: logData.timestamp,
          note: logData.note
        });
      }
    } catch (err: any) {
      console.error(`   ✗ Error procesando negative habit doc ${doc.id}:`, err.message);
      stats.errors++;
    }
  }

  if (logs.length > 0) {
    const { error } = await supabase.from('negative_habit_logs').insert(logs);
    if (error) {
      console.error(`   ✗ Error insertando negative habits:`, error.message);
      stats.errors++;
    } else {
      stats.imported = logs.length;
    }
  }

  console.log(`   ✓ ${stats.imported} negative habit logs importados (${stats.errors} errores)`);
  return stats;
}

/**
 * 11. Importar Recipes
 */
async function importRecipes(recipes: any[], userId: string): Promise<ImportStats> {
  console.log('\n📦 Importando Recipes...');
  const stats: ImportStats = { collection: 'recipes', imported: 0, errors: 0 };

  for (const recipe of recipes) {
    try {
      const { error } = await supabase.from('recipes').insert({
        id: recipe.id,
        user_id: userId,
        name: recipe.name,
        description: recipe.description,
        difficulty: recipe.difficulty,
        prep_time: recipe.prepTime,
        meal_type: recipe.mealType,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        nutrition: recipe.nutrition,
        favorite: recipe.favorite || false,
        created_at: recipe.createdAt
      });

      if (error) throw error;
      stats.imported++;
    } catch (err: any) {
      console.error(`   ✗ Error importando recipe ${recipe.id}:`, err.message);
      stats.errors++;
    }
  }

  console.log(`   ✓ ${stats.imported} recipes importados (${stats.errors} errores)`);
  return stats;
}

/**
 * 12. Importar Meals
 */
async function importMeals(meals: any[], userId: string): Promise<ImportStats> {
  console.log('\n📦 Importando Meals...');
  const stats: ImportStats = { collection: 'meals', imported: 0, errors: 0 };

  for (const meal of meals) {
    try {
      const [_, date] = meal.id.split('_');

      // Insertar cada meal type del plan
      for (const [mealType, mealData] of Object.entries(meal.meals || {})) {
        const data = mealData as any;

        const { error } = await supabase.from('meal_plan_entries').insert({
          user_id: userId,
          date: date,
          meal_type: mealType,
          name: data.name,
          notes: data.notes,
          calories: data.calories
        });

        if (error) {
          console.error(`   ⚠️ Error importando meal ${meal.id} - ${mealType}`);
          stats.errors++;
        } else {
          stats.imported++;
        }
      }
    } catch (err: any) {
      console.error(`   ✗ Error procesando meal doc ${meal.id}:`, err.message);
      stats.errors++;
    }
  }

  console.log(`   ✓ ${stats.imported} meal entries importados (${stats.errors} errores)`);
  return stats;
}

/**
 * 13. Importar Prepared Meals
 */
async function importPreparedMeals(preparedMeals: any[], userId: string): Promise<ImportStats> {
  console.log('\n📦 Importando Prepared Meals...');
  const stats: ImportStats = { collection: 'prepared-meals', imported: 0, errors: 0 };

  for (const meal of preparedMeals) {
    try {
      const { error } = await supabase.from('prepared_meals').insert({
        id: meal.id,
        user_id: userId,
        name: meal.name,
        portions: meal.portions
      });

      if (error) throw error;
      stats.imported++;
    } catch (err: any) {
      console.error(`   ✗ Error importando prepared meal ${meal.id}:`, err.message);
      stats.errors++;
    }
  }

  console.log(`   ✓ ${stats.imported} prepared meals importados (${stats.errors} errores)`);
  return stats;
}

/**
 * 14. Importar Shopping List
 */
async function importShoppingList(shoppingList: any[], userId: string): Promise<ImportStats> {
  console.log('\n📦 Importando Shopping List...');
  const stats: ImportStats = { collection: 'shopping-list', imported: 0, errors: 0 };

  for (const item of shoppingList) {
    try {
      const { error } = await supabase.from('shopping_items').insert({
        id: item.id,
        user_id: userId,
        name: item.name,
        stock: item.stock || 0,
        to_buy: item.toBuy || 0,
        price: item.price,
        category: item.category,
        place: item.place,
        consume_by: item.consumeBy,
        status: item.status,
        next_purchase: item.nextPurchase || false,
        created_at: item.createdAt,
        updated_at: item.updatedAt
      });

      if (error) throw error;
      stats.imported++;
    } catch (err: any) {
      console.error(`   ✗ Error importando shopping item ${item.id}:`, err.message);
      stats.errors++;
    }
  }

  console.log(`   ✓ ${stats.imported} shopping items importados (${stats.errors} errores)`);
  return stats;
}

/**
 * Main import function
 */
async function importAllData() {
  console.log('🚀 Iniciando importación a Supabase...\n');

  // Determinar archivo a importar
  const args = process.argv.slice(2);
  let exportFile: string;

  if (args.length > 0) {
    exportFile = args[0];
  } else {
    // Buscar el export más reciente
    exportFile = join(process.cwd(), 'firebase-exports', 'firebase-export-2026-01-02T14-46-14.json');
  }

  console.log(`📁 Leyendo: ${exportFile}\n`);

  // Leer export data
  let exportData: ExportData;
  try {
    exportData = JSON.parse(readFileSync(exportFile, 'utf8'));
  } catch (err: any) {
    console.error('❌ Error leyendo archivo de export:', err.message);
    process.exit(1);
  }

  // Obtener user ID
  const userId = getDefaultUserId(exportData);
  if (!userId) {
    console.error('❌ No se pudo encontrar un userId en los datos exportados');
    process.exit(1);
  }

  console.log(`👤 Usuario detectado: ${userId}\n`);
  console.log('⚠️  IMPORTANTE: Asegúrate de que este usuario exista en Supabase Auth\n');

  const allStats: ImportStats[] = [];

  // Importar cada colección
  try {
    if (exportData.tasks?.length) {
      allStats.push(await importTasks(exportData.tasks, userId));
    }

    if (exportData.goals?.length) {
      allStats.push(await importGoals(exportData.goals, userId));
    }

    if (exportData.habits?.length) {
      allStats.push(await importHabits(exportData.habits, userId));
    }

    if (exportData.moods?.length) {
      allStats.push(await importMoods(exportData.moods, userId));
    }

    if (exportData.energy?.length) {
      allStats.push(await importEnergy(exportData.energy, userId));
    }

    if (exportData.water?.length) {
      allStats.push(await importWater(exportData.water, userId));
    }

    if (exportData.exercises?.length) {
      allStats.push(await importExercises(exportData.exercises, userId));
    }

    if (exportData.pomodoro?.length) {
      allStats.push(await importPomodoro(exportData.pomodoro, userId));
    }

    if (exportData.journal?.length) {
      allStats.push(await importJournal(exportData.journal, userId));
    }

    if (exportData['negative-habits']?.length) {
      allStats.push(await importNegativeHabits(exportData['negative-habits'], userId));
    }

    if (exportData.recipes?.length) {
      allStats.push(await importRecipes(exportData.recipes, userId));
    }

    if (exportData.meals?.length) {
      allStats.push(await importMeals(exportData.meals, userId));
    }

    if (exportData['prepared-meals']?.length) {
      allStats.push(await importPreparedMeals(exportData['prepared-meals'], userId));
    }

    if (exportData['shopping-list']?.length) {
      allStats.push(await importShoppingList(exportData['shopping-list'], userId));
    }

    // Resumen final
    console.log('\n📊 Resumen de Importación:');
    console.log('═'.repeat(50));

    const totalImported = allStats.reduce((sum, s) => sum + s.imported, 0);
    const totalErrors = allStats.reduce((sum, s) => sum + s.errors, 0);

    for (const stat of allStats) {
      console.log(`   ${stat.collection.padEnd(20)} ${stat.imported.toString().padStart(5)} registros (${stat.errors} errores)`);
    }

    console.log('═'.repeat(50));
    console.log(`   TOTAL: ${totalImported} registros importados`);
    console.log(`   ERRORES: ${totalErrors}`);

    if (totalErrors === 0) {
      console.log('\n🎉 Importación completada exitosamente!');
    } else {
      console.log('\n⚠️  Importación completada con algunos errores. Revisa los logs arriba.');
    }

  } catch (err: any) {
    console.error('\n❌ Error fatal durante la importación:', err.message);
    process.exit(1);
  }
}

// Ejecutar importación
importAllData().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
