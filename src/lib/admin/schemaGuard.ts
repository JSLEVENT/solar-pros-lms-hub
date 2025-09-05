import { supabase } from '@/integrations/supabase/client';

// Lightweight schema guard without RPC dependency (avoids 404 on pg_table_def)
export async function checkAdminSchema() {
  const requiredTables = ['teams','profiles','courses','enrollments','learning_plans','content_assets'];
  const optionalColumns: Record<string,string[]> = { teams:['is_archived'], profiles:['is_active'] };
  const issues: string[] = [];
  for (const table of requiredTables) {
    // Head select to probe table existence
    const probe = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (probe.error) {
      // PostgREST returns 42P01 in error details for missing relation
      issues.push(`Missing table: ${table}`);
      continue;
    }
    if (optionalColumns[table]) {
      const sample = await supabase.from(table).select('*').limit(1);
      if (!sample.error && sample.data && sample.data.length) {
        for (const col of optionalColumns[table]) {
          if (!(col in sample.data[0])) issues.push(`Column ${table}.${col} not present`);
        }
      }
    }
  }
  return issues;
}
