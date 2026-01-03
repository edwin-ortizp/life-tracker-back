/**
 * Script de importación a Supabase CON LIMPIEZA DE DATOS
 * Intercepta y corrige datos antes de insertarlos
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper: Limpiar valores numéricos
function cleanNumeric(value: any, defaultValue = 0): number {
  if (value === null || value === undefined) return defaultValue;
  const num = Number(value);
  if (isNaN(num)) return defaultValue;
  return Math.round(num); // Redondear decimales a enteros
}

// Helper: Validar y limpiar timestamp
function cleanTimestamp(value: any): number {
  if (!value) return Date.now();
  const num = Number(value);
  return isNaN(num) ? Date.now() : num;
}

// Helper: Limpiar string
function cleanString(value: any, defaultValue = ''): string {
  if (!value) return defaultValue;
  return String(value).trim();
}

async function importData() {
  console.log('🚀 Iniciando importación con limpieza de datos...\n');

  // Leer archivo de exportación
  const { readdirSync } = await import('fs');
  const exportPath = join(process.cwd(), 'firebase-exports');
  const files = readdirSync(exportPath).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.error('❌ No se encontraron archivos de exportación en firebase-exports/');
    process.exit(1);
  }

  const latestFile = files.sort().reverse()[0];
  console.log(`📂 Usando archivo: ${latestFile}\n`);

  const exportData = JSON.parse(
    readFileSync(join(exportPath, latestFile), 'utf8')
  );

  const userId = 'HPiS7rrqvKVm9uZBV8sHzW8wQz33';

  let stats = {
    tasks: { success: 0, errors: 0 },
    habits: { success: 0, errors: 0 },
    moods: { success: 0, errors: 0 },
    energy: { success: 0, errors: 0 },
    water: { success: 0, errors: 0 },
    exercise: { success: 0, errors: 0 },
    pomodoro: { success: 0, errors: 0 },
    journal: { success: 0, errors: 0 },
    meals: { success: 0, errors: 0 },
    negativeHabits: { success: 0, errors: 0 },
    shopping: { success: 0, errors: 0 },
    goals: { success: 0, errors: 0 },
    recipes: { success: 0, errors: 0 },
    preparedMeals: { success: 0, errors: 0 }
  };

  // ============================================================================
  // 1. TASKS (Limpiar progress decimal → entero)
  // ============================================================================
  console.log('📝 Importando Tasks...');
  for (const task of exportData.tasks || []) {
    try {
      const taskData: any = {
        id: task.id,
        user_id: userId,
        task_code: cleanNumeric(task.taskCode, null),
        title: cleanString(task.title, 'Sin título'),
        description: cleanString(task.description, null),
        completed: !!task.completed,
        category: cleanString(task.category, null),
        priority: task.priority || null,
        size: task.size || null,
        start_date: task.startDate || null,
        end_date: task.endDate || null,
        is_recurrent: !!task.isRecurrent,
        is_private: !!task.isPrivate,
        recurrence: task.recurrence || null,
        progress: cleanNumeric(task.progress, 0), // ✅ Redondear decimales
        elapsed_seconds: cleanNumeric(task.elapsedSeconds, 0),
        timer_paused: !!task.timerPaused,
        paused_duration: cleanNumeric(task.pausedDuration, 0),
        timer_active: !!task.timerActive,
        estimated_time: cleanNumeric(task.estimatedTime, null),
        created_at: task.createdAt || new Date().toISOString(),
        updated_at: task.updatedAt || new Date().toISOString()
      };

      await supabase.from('tasks').insert(taskData);
      stats.tasks.success++;
    } catch (error: any) {
      console.error(`  ❌ Task ${task.id}: ${error.message}`);
      stats.tasks.errors++;
    }
  }

  // ============================================================================
  // 2. HABITS
  // ============================================================================
  console.log('✅ Importando Habits...');
  const habitCompletions: any[] = [];

  for (const doc of exportData.habits || []) {
    const [docUserId, yearMonth] = doc.id.split('_');

    for (const [key, completed] of Object.entries(doc.habits || {})) {
      const [habitIdStr, dateStr] = key.split('_');
      const habitId = parseInt(habitIdStr);

      if (isNaN(habitId) || !dateStr) {
        console.error(`  ⚠️  Skipping invalid habit key: ${key}`);
        continue;
      }

      habitCompletions.push({
        user_id: userId,
        habit_id: habitId,
        date: dateStr,
        completed: !!completed
      });
    }
  }

  if (habitCompletions.length > 0) {
    const batchSize = 500;
    for (let i = 0; i < habitCompletions.length; i += batchSize) {
      const batch = habitCompletions.slice(i, i + batchSize);
      try {
        await supabase.from('habit_completions').insert(batch);
        stats.habits.success += batch.length;
      } catch (error: any) {
        console.error(`  ❌ Batch ${i / batchSize + 1}: ${error.message}`);
        stats.habits.errors += batch.length;
      }
    }
  }

  // ============================================================================
  // 3. MOODS
  // ============================================================================
  console.log('😊 Importando Moods...');
  for (const doc of exportData.moods || []) {
    const [docUserId, date] = doc.id.split('_');

    for (const mood of doc.moods || []) {
      try {
        await supabase.from('mood_entries').insert({
          user_id: userId,
          date: date,
          emoji: cleanString(mood.emoji, '😐'),
          text: cleanString(mood.text, ''),
          value: cleanNumeric(mood.value, 5),
          time: cleanString(mood.time, '12:00'),
          timestamp: cleanTimestamp(mood.timestamp)
        });
        stats.moods.success++;
      } catch (error: any) {
        console.error(`  ❌ Mood ${date}: ${error.message}`);
        stats.moods.errors++;
      }
    }
  }

  // ============================================================================
  // 4. ENERGY
  // ============================================================================
  console.log('⚡ Importando Energy...');
  for (const doc of exportData.energy || []) {
    const [docUserId, date] = doc.id.split('_');

    for (const entry of doc.entries || []) {
      try {
        await supabase.from('energy_entries').insert({
          user_id: userId,
          date: date,
          level: cleanNumeric(entry.level, 3),
          comment: cleanString(entry.comment, null),
          time: cleanString(entry.time, '12:00'),
          timestamp: cleanTimestamp(entry.timestamp)
        });
        stats.energy.success++;
      } catch (error: any) {
        console.error(`  ❌ Energy ${date}: ${error.message}`);
        stats.energy.errors++;
      }
    }
  }

  // ============================================================================
  // 5. WATER (Asegurar hydration_value)
  // ============================================================================
  console.log('💧 Importando Water...');
  for (const doc of exportData.water || []) {
    const [docUserId, date] = doc.id.split('_');

    for (const drink of doc.drinks || []) {
      try {
        await supabase.from('drink_logs').insert({
          user_id: userId,
          date: date,
          drink_type: cleanString(drink.type, 'water'),
          amount: cleanNumeric(drink.amount, 250),
          hydration_value: cleanNumeric(drink.hydration, drink.amount || 250), // ✅ Default a amount
          time: cleanString(drink.time, '12:00'),
          timestamp: cleanTimestamp(drink.timestamp)
        });
        stats.water.success++;
      } catch (error: any) {
        console.error(`  ❌ Water ${date}: ${error.message}`);
        stats.water.errors++;
      }
    }
  }

  // ============================================================================
  // 6. EXERCISE (Asegurar exercise_id)
  // ============================================================================
  console.log('🏋️ Importando Exercise...');
  for (const doc of exportData.exercises || []) {
    const [docUserId, date] = doc.id.split('_');

    for (const exercise of doc.exercises || []) {
      try {
        const exerciseId = cleanNumeric(exercise.exerciseId, null);
        if (exerciseId === null) {
          console.warn(`  ⚠️  Skipping exercise without ID on ${date}`);
          continue;
        }

        await supabase.from('exercise_logs').insert({
          user_id: userId,
          date: date,
          exercise_id: exerciseId, // ✅ Requerido
          sets: cleanNumeric(exercise.sets, null),
          reps: cleanNumeric(exercise.reps, null),
          duration: cleanNumeric(exercise.duration, null),
          distance: exercise.distance || null,
          weight: exercise.weight || null,
          calories: cleanNumeric(exercise.calories, null),
          steps: cleanNumeric(exercise.steps, null),
          notes: cleanString(exercise.notes, null)
        });
        stats.exercise.success++;
      } catch (error: any) {
        console.error(`  ❌ Exercise ${date}: ${error.message}`);
        stats.exercise.errors++;
      }
    }
  }

  // ============================================================================
  // 7. POMODORO
  // ============================================================================
  console.log('🍅 Importando Pomodoro...');
  for (const doc of exportData.pomodoro || []) {
    const [docUserId, date] = doc.id.split('_');

    for (const session of doc.sessions || []) {
      try {
        await supabase.from('pomodoro_sessions').insert({
          user_id: userId,
          date: date,
          start_time: session.startTime,
          end_time: session.endTime || null,
          duration: cleanNumeric(session.duration, 1500),
          completed: !!session.completed,
          description: cleanString(session.description, null)
        });
        stats.pomodoro.success++;
      } catch (error: any) {
        console.error(`  ❌ Pomodoro ${date}: ${error.message}`);
        stats.pomodoro.errors++;
      }
    }
  }

  // ============================================================================
  // 8. JOURNAL
  // ============================================================================
  console.log('📔 Importando Journal...');
  for (const doc of exportData.journal || []) {
    const [docUserId, date] = doc.id.split('_');

    try {
      await supabase.from('journal_entries').insert({
        user_id: userId,
        date: date,
        text: cleanString(doc.text, ''),
        display_time: cleanString(doc.displayTime, null),
        updated_at: doc.lastUpdated || new Date().toISOString()
      });
      stats.journal.success++;
    } catch (error: any) {
      console.error(`  ❌ Journal ${date}: ${error.message}`);
      stats.journal.errors++;
    }
  }

  // ============================================================================
  // 9. MEALS (Limpiar estructura)
  // ============================================================================
  console.log('🍽️ Importando Meals...');
  for (const doc of exportData.meals || []) {
    const [docUserId, yearMonth] = doc.id.split('_');

    for (const [date, dayMeals] of Object.entries(doc.meals || {})) {
      for (const [mealType, meal] of Object.entries(dayMeals as any)) {
        try {
          // ✅ Validar que meal sea un objeto válido
          if (!meal || typeof meal !== 'object') {
            console.warn(`  ⚠️  Skipping invalid meal structure: ${date} ${mealType}`);
            continue;
          }

          const mealData = meal as any;

          // ✅ Validar que tenga name
          if (!mealData.name || typeof mealData.name !== 'string' || mealData.name.trim() === '') {
            console.warn(`  ⚠️  Skipping meal without name: ${date} ${mealType}`);
            continue;
          }

          await supabase.from('meal_plan_entries').insert({
            user_id: userId,
            date: date,
            meal_type: mealType,
            name: cleanString(mealData.name, 'Comida'),
            notes: cleanString(mealData.notes, null),
            calories: cleanNumeric(mealData.calories, null),
            recipe_id: mealData.recipeId || null
          });
          stats.meals.success++;
        } catch (error: any) {
          console.error(`  ❌ Meal ${date} ${mealType}: ${error.message}`);
          stats.meals.errors++;
        }
      }
    }
  }

  // ============================================================================
  // 10. NEGATIVE HABITS (Asegurar timestamp)
  // ============================================================================
  console.log('🚫 Importando Negative Habits...');
  for (const doc of exportData['negative-habits'] || []) {
    const [docUserId, yearMonth] = doc.id.split('_');

    for (const [date, dayHabits] of Object.entries(doc.habits || {})) {
      for (const [habitIdStr, log] of Object.entries(dayHabits as any)) {
        try {
          const habitId = parseInt(habitIdStr);
          if (isNaN(habitId)) continue;

          const logData = log as any;

          await supabase.from('negative_habit_logs').insert({
            user_id: userId,
            habit_id: habitId,
            timestamp: cleanTimestamp(logData.timestamp), // ✅ Asegurar timestamp
            note: cleanString(logData.note, null)
          });
          stats.negativeHabits.success++;
        } catch (error: any) {
          console.error(`  ❌ Negative Habit ${date}: ${error.message}`);
          stats.negativeHabits.errors++;
        }
      }
    }
  }

  // ============================================================================
  // 11. SHOPPING LIST
  // ============================================================================
  console.log('🛒 Importando Shopping List...');
  for (const item of exportData['shopping-list'] || []) {
    try {
      await supabase.from('shopping_items').insert({
        id: item.id,
        user_id: userId,
        name: cleanString(item.name, 'Item'),
        stock: cleanNumeric(item.stock, 0),
        to_buy: cleanNumeric(item.toBuy, 0),
        price: item.price || null,
        category: cleanString(item.category, null),
        place: cleanString(item.place, null),
        consume_by: item.consumeBy || null,
        status: item.status || 'to-buy',
        next_purchase: !!item.nextPurchase,
        created_at: item.createdAt || new Date().toISOString(),
        updated_at: item.updatedAt || new Date().toISOString()
      });
      stats.shopping.success++;
    } catch (error: any) {
      console.error(`  ❌ Shopping ${item.id}: ${error.message}`);
      stats.shopping.errors++;
    }
  }

  // ============================================================================
  // 12. GOALS
  // ============================================================================
  console.log('🎯 Importando Goals...');
  for (const goal of exportData.goals || []) {
    try {
      // Insert goal
      await supabase.from('goals').insert({
        id: goal.id,
        user_id: userId,
        title: cleanString(goal.title, 'Objetivo'),
        description: cleanString(goal.description, null),
        status: goal.status || 'active',
        start_date: goal.startDate || null,
        due_date: goal.dueDate || null,
        positive_count: cleanNumeric(goal.positiveCount, 0),
        negative_count: cleanNumeric(goal.negativeCount, 0),
        numeric_goal: goal.numericGoal || null,
        created_at: goal.createdAt || new Date().toISOString(),
        updated_at: goal.updatedAt || new Date().toISOString()
      });

      // Insert tasks
      for (const task of goal.tasks || []) {
        await supabase.from('goal_tasks').insert({
          goal_id: goal.id,
          title: cleanString(task.title, 'Tarea'),
          done: !!task.done,
          created_at: task.createdAt || new Date().toISOString(),
          completed_at: task.completedAt || null
        });
      }

      // Insert entries
      for (const entry of goal.entries || []) {
        await supabase.from('goal_entries').insert({
          goal_id: goal.id,
          text: cleanString(entry.text, ''),
          date: entry.date || new Date().toISOString().split('T')[0],
          is_milestone: !!entry.isMilestone
        });
      }

      // Insert numeric entries
      for (const numEntry of goal.numericEntries || []) {
        await supabase.from('goal_numeric_entries').insert({
          goal_id: goal.id,
          value: Number(numEntry.value) || 0,
          date: numEntry.date || new Date().toISOString().split('T')[0],
          note: cleanString(numEntry.note, null)
        });
      }

      stats.goals.success++;
    } catch (error: any) {
      console.error(`  ❌ Goal ${goal.id}: ${error.message}`);
      stats.goals.errors++;
    }
  }

  // ============================================================================
  // 13. RECIPES
  // ============================================================================
  console.log('📖 Importando Recipes...');
  for (const recipe of exportData.recipes || []) {
    try {
      await supabase.from('recipes').insert({
        id: recipe.id,
        user_id: userId,
        name: cleanString(recipe.name, 'Receta'),
        description: cleanString(recipe.description, null),
        difficulty: recipe.difficulty || null,
        prep_time: cleanNumeric(recipe.prepTime, null),
        meal_type: recipe.mealType || null,
        ingredients: recipe.ingredients || [],
        instructions: cleanString(recipe.instructions, ''),
        nutrition: recipe.nutrition || null,
        favorite: !!recipe.favorite,
        created_at: recipe.createdAt || new Date().toISOString()
      });
      stats.recipes.success++;
    } catch (error: any) {
      console.error(`  ❌ Recipe ${recipe.id}: ${error.message}`);
      stats.recipes.errors++;
    }
  }

  // ============================================================================
  // 14. PREPARED MEALS
  // ============================================================================
  console.log('🥘 Importando Prepared Meals...');
  for (const meal of exportData['prepared-meals'] || []) {
    try {
      await supabase.from('prepared_meals').insert({
        id: meal.id,
        user_id: userId,
        name: cleanString(meal.name, 'Comida preparada'),
        portions: cleanNumeric(meal.portions, null)
      });
      stats.preparedMeals.success++;
    } catch (error: any) {
      console.error(`  ❌ Prepared Meal ${meal.id}: ${error.message}`);
      stats.preparedMeals.errors++;
    }
  }

  // ============================================================================
  // RESUMEN
  // ============================================================================
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN DE IMPORTACIÓN\n');

  let totalSuccess = 0;
  let totalErrors = 0;

  for (const [module, counts] of Object.entries(stats)) {
    totalSuccess += counts.success;
    totalErrors += counts.errors;

    const icon = counts.errors === 0 ? '✅' : counts.errors < counts.success ? '⚠️' : '❌';
    console.log(`${icon} ${module.padEnd(20)} → ${counts.success} éxitos, ${counts.errors} errores`);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`✅ Total Éxitos: ${totalSuccess}`);
  console.log(`❌ Total Errores: ${totalErrors}`);
  console.log(`📈 Tasa de Éxito: ${((totalSuccess / (totalSuccess + totalErrors)) * 100).toFixed(2)}%`);
  console.log('='.repeat(80) + '\n');
}

importData().catch(console.error);
