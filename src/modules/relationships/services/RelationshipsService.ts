import { supabase } from '@/core/supabase';

export class RelationshipsService {
  static readonly client = supabase;

  static table(tableName: string) {
    return (supabase as any).from(tableName);
  }
}
