import { supabase } from '@/integrations/supabase/client';

// Simple in‑memory cache so we don't hammer the API every render
let lastRun: number | null = null;
let cachedIssues: string[] | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute is plenty; schema rarely changes live

// Helper to safely probe a column; only treat 42703 (undefined_column) as missing
async function probeColumn(table: string, column: string): Promise<boolean /* exists */> {
  // Use head select for zero-row metadata probe; PostgREST returns 200 if column valid
  const res = await supabase.from(table as any).select(column as any, { head: true, count: 'exact' });
  if (!res.error) return true;
  const code = (res.error as any).code;
  if (code === '42703' || /42703/.test(res.error.message) || /column .* does not exist/i.test(res.error.message)) {
    return false; // genuinely missing
  }
  // Any other error (400, RLS denial, etc.) we optimistically assume column exists to avoid noisy warnings.
  return true;
}

// Lightweight schema guard w/ caching & tolerant column probing to avoid noisy 400s
export async function checkAdminSchema() {
  const now = Date.now();
  if (lastRun && cachedIssues && (now - lastRun) < CACHE_TTL_MS) {
    return cachedIssues;
  }

  const requiredTables = ['teams','profiles','courses','enrollments','learning_plans','content_assets'];
  // Avoid probing optional columns to prevent 400s in console when columns don't exist across environments
  const optionalColumns: Record<string,string[]> = {};
  const issues: string[] = [];

  for (const table of requiredTables) {
    // Table existence probe (HEAD request)
    const probe = await supabase.from(table as any).select('*', { head: true, count: 'exact' });
    if (probe.error) {
      const code = (probe.error as any).code;
      // Only mark missing if relation truly absent (42P01) or message indicates missing
      if (code === '42P01' || /relation .* does not exist/i.test(probe.error.message)) {
        issues.push(`Missing table: ${table}`);
        continue;
      }
      // Other errors (RLS, etc.) are ignored to prevent false positives.
    }

    const cols = optionalColumns[table];
    if (cols) {
      for (const col of cols) {
        const exists = await probeColumn(table, col);
        if (!exists) {
          issues.push(`Column ${table}.${col} not present`);
        }
      }
    }
  }

  lastRun = Date.now();
  cachedIssues = issues;
  return issues;
}
