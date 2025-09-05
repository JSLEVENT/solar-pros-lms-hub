import { supabase } from '@/integrations/supabase/client';

// Checks that critical tables exist and optional columns; returns issues array
export async function checkAdminSchema() {
  const requiredTables = ['teams','profiles','courses','enrollments','learning_plans','content_assets'];
  const optionalColumns: Record<string,string[]> = { teams:['is_archived'], profiles:['is_active'] };
  const issues: string[] = [];
  for (const table of requiredTables) {
    const { data, error } = await supabase.rpc('pg_table_def', { t: table } as any);
    if (error || !data) {
      // fallback: attempt a count
      const probe = await supabase.from(table).select('id', { count:'exact', head:true });
      if (probe.error) { issues.push(`Missing table: ${table}`); continue; }
    }
    if (optionalColumns[table]) {
      const probe = await supabase.from(table).select('*').limit(1);
      if (!probe.error && probe.data && probe.data.length) {
        for (const col of optionalColumns[table]) {
          if (!(col in probe.data[0])) issues.push(`Column ${table}.${col} not present`);
        }
      }
    }
  }
  return issues;
}
