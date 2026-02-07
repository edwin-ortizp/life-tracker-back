import { supabase } from '@/core/supabase';

export class ExerciseService {
  static readonly client = supabase;

  static async getExerciseTypes(userId: string) {
    return supabase
      .from('exercise_types')
      .select('*')
      .eq('user_id', userId)
      .order('category', { ascending: true })
      .order('name', { ascending: true });
  }

  static subscribeExerciseTypes(userId: string, onChange: () => void) {
    return supabase
      .channel('exercise_types_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exercise_types',
          filter: `user_id=eq.${userId}`
        },
        onChange
      )
      .subscribe();
  }

  static async createExerciseType(input: {
    userId: string;
    name: string;
    caloriesPerHour: number;
    stepsEquivalent: number;
    category: string;
  }) {
    return supabase.from('exercise_types').insert({
      user_id: input.userId,
      name: input.name,
      calories_per_hour: input.caloriesPerHour,
      steps_equivalent: input.stepsEquivalent,
      category: input.category
    });
  }

  static async updateExerciseType(
    id: string,
    input: {
      userId: string;
      name: string;
      caloriesPerHour: number;
      stepsEquivalent: number;
      category: string;
    }
  ) {
    return supabase
      .from('exercise_types')
      .update({
        user_id: input.userId,
        name: input.name,
        calories_per_hour: input.caloriesPerHour,
        steps_equivalent: input.stepsEquivalent,
        category: input.category
      })
      .eq('id', id);
  }

  static async deleteExerciseType(id: string) {
    return supabase.from('exercise_types').delete().eq('id', id);
  }

  static async getExerciseLogsByDate(userId: string, date: string) {
    return supabase
      .from('exercise_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date);
  }

  static async insertExerciseLog(input: {
    userId: string;
    date: string;
    exerciseTypeId?: string;
    exerciseLegacyId: number;
    sets: number | null;
    reps: number | null;
    duration: number | null;
    distance: number | null;
    weight: number | null;
    calories: number | null;
    steps: number | null;
    notes: string | null;
  }) {
    const payload: Record<string, unknown> = {
      user_id: input.userId,
      date: input.date,
      exercise_id: input.exerciseLegacyId,
      sets: input.sets,
      reps: input.reps,
      duration: input.duration,
      distance: input.distance,
      weight: input.weight,
      calories: input.calories,
      steps: input.steps,
      notes: input.notes
    };

    if (input.exerciseTypeId) {
      payload.exercise_type_id = input.exerciseTypeId;
    }

    let result = await supabase.from('exercise_logs').insert(payload);

    // Backward compatibility: some DBs still do not have exercise_type_id.
    if (
      result.error &&
      (result.error.code === '42703' || result.error.message?.includes('exercise_type_id'))
    ) {
      delete payload.exercise_type_id;
      result = await supabase.from('exercise_logs').insert(payload);
    }

    return result;
  }

  static async getExerciseLogIdsByDate(userId: string, date: string) {
    return supabase
      .from('exercise_logs')
      .select('id, exercise_id')
      .eq('user_id', userId)
      .eq('date', date)
      .order('id', { ascending: true });
  }

  static async updateExerciseLogById(
    id: string | number,
    input: {
      exerciseTypeId?: string;
      exerciseLegacyId: number;
      sets: number | null;
      reps: number | null;
      duration: number | null;
      distance: number | null;
      weight: number | null;
      calories: number | null;
      steps: number | null;
      notes: string | null;
    }
  ) {
    const payload: Record<string, unknown> = {
      exercise_id: input.exerciseLegacyId,
      sets: input.sets,
      reps: input.reps,
      duration: input.duration,
      distance: input.distance,
      weight: input.weight,
      calories: input.calories,
      steps: input.steps,
      notes: input.notes
    };
    if (input.exerciseTypeId) {
      payload.exercise_type_id = input.exerciseTypeId;
    }

    let result = await supabase
      .from('exercise_logs')
      .update(payload)
      .eq('id', id);

    if (
      result.error &&
      (result.error.code === '42703' || result.error.message?.includes('exercise_type_id'))
    ) {
      delete payload.exercise_type_id;
      result = await supabase.from('exercise_logs').update(payload).eq('id', id);
    }

    return result;
  }

  static async deleteExerciseLogById(id: string | number) {
    return supabase.from('exercise_logs').delete().eq('id', id);
  }

  static async getExerciseStatsRange(userId: string, start: string, end: string) {
    return supabase
      .from('exercises')
      .select('date, calories_burned')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true });
  }
}
