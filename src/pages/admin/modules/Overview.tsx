import { useAdminStats } from '@/hooks/admin/useAdminStats';
import { BarChart3, Users, BookOpen, Award, TrendingUp, Layers } from 'lucide-react';

const cards = [
  { key: 'totalUsers', label: 'Users', icon: Users },
  { key: 'totalCourses', label: 'Courses', icon: BookOpen },
  { key: 'totalEnrollments', label: 'Enrollments', icon: BarChart3 },
  { key: 'totalCertificates', label: 'Certificates', icon: Award },
  { key: 'activeUsers', label: 'Active (7d)', icon: TrendingUp },
  { key: 'totalTeams', label: 'Teams', icon: Layers },
];

export function AdminOverview(){
  const { data, isLoading, isError } = useAdminStats();
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Overview</h1>
      {isLoading && <p className="text-sm text-muted-foreground">Loading KPIs…</p>}
      {isError && <p className="text-sm text-red-600">Failed to load stats.</p>}
      {data && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {cards.map(c => {
            const Icon = c.icon; const value = (data as any)[c.key];
            return (
              <div key={c.key} className="p-4 rounded-xl border bg-card flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4" />{c.label}</div>
                <div className="text-2xl font-semibold tabular-nums">{c.key === 'completionRate' ? value.toFixed(1)+'%' : value}</div>
              </div>
            );
          })}
          <div className="p-4 rounded-xl border bg-card flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" />Completion</div>
            <div className="text-2xl font-semibold tabular-nums">{data.completionRate.toFixed(1)}%</div>
          </div>
        </div>
      )}
    </div>
  );
}

