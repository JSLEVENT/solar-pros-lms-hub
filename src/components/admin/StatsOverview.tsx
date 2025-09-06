import { ModernCard, ModernCardContent } from '@/components/ui/modern-card';
import { Users, BookOpen, GraduationCap, Award, Layers } from 'lucide-react';
import { AdminStats } from '@/lib/admin/queries';

export function StatsOverview({ stats }: { stats: AdminStats | null }){
  if(!stats) return null;
  const cards = [
    { label:'Total Users', value: stats.totalUsers, icon: Users, color:'from-primary/20 to-primary/10', iconColor:'text-primary' },
    { label:'Total Courses', value: stats.totalCourses, icon: BookOpen, color:'from-solar-red/20 to-solar-red/10', iconColor:'text-solar-red' },
    { label:'Total Enrollments', value: stats.totalEnrollments, icon: GraduationCap, color:'from-success/20 to-success/10', iconColor:'text-success' },
    { label:'Completion Rate', value: stats.completionRate.toFixed(1)+'%', icon: Award, color:'from-solar-glow/20 to-solar-glow/10', iconColor:'text-solar-glow' },
    { label:'Total Teams', value: stats.totalTeams, icon: Layers, color:'from-secondary/20 to-secondary/10', iconColor:'text-secondary-foreground' },
    { label:'Total Managers', value: stats.totalManagers, icon: Users, color:'from-primary/10 to-primary/5', iconColor:'text-primary' },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
      {cards.map(c=> (
        <ModernCard key={c.label} variant="floating">
          <ModernCardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center`}>
                <c.icon className={`h-6 w-6 ${c.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="text-2xl font-bold">{c.value}</p>
              </div>
            </div>
          </ModernCardContent>
        </ModernCard>
      ))}
    </div>
  );
}
