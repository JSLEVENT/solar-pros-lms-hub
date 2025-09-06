import { supabase } from '@/integrations/supabase/client';

// Lightweight schema guard without RPC dependency (avoids 404 on pg_table_def)
export async function checkAdminSchema() {
  const requiredTables = ['teams','profiles','courses','enrollments','learning_plans','content_assets'];
  const optionalColumns: Record<string,string[]> = { teams:['is_archived'], profiles:['is_active'] };
  const issues: string[] = [];
  for (const table of requiredTables) {
    // Head select to probe table existence
  const probe = await supabase.from(table as any).select('*', { count: 'exact', head: true });
    if (probe.error) {
      // PostgREST returns 42P01 in error details for missing relation
      issues.push(`Missing table: ${table}`);
      continue;
    }
    if (optionalColumns[table]) {
      for (const col of optionalColumns[table]) {
        // Execute a lightweight column existence probe by selecting the column only
  const probeCol = await supabase.from(table as any).select(col as any).limit(1);
        if (probeCol.error) {
          // 42703 indicates column missing
          const code = (probeCol.error as any).code;
            if (code === '42703' || /column/i.test(probeCol.error.message)) {
              issues.push(`Column ${table}.${col} not present`);
            }
        }
      }
    }
  }
  return issues;
}
