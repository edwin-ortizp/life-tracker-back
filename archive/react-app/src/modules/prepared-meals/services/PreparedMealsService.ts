import { supabase } from '@/core/supabase';

export class PreparedMealsService {
  static readonly client = supabase;

  static table(tableName: string) {
    return (supabase as any).from(tableName);
  }

  // TODO: Add static methods for data access in this module.
}
