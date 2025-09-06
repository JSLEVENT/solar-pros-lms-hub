// Refactored modular Admin Dashboard (final clean implementation)
import { useState } from 'react';
import { LMSLayout } from '@/components/LMSLayout';
import { ModernCard, ModernCardContent } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Shield, TrendingUp, FileText, Settings, BarChart3, Users, BookOpen, Layers } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchAdminStats, exportEnrollmentsCSV, downloadCSV } from '@/lib/admin/queries';
import { StatsOverview } from '@/components/admin/StatsOverview';
import { UserManagement } from '@/components/admin/UserManagement';
import { CourseManagement } from '@/components/admin/CourseManagement';
import { TeamManagementPanel } from '@/components/admin/TeamManagementPanel';

const ContentRepository = () => (
  <ModernCard variant="glass">
    <ModernCardContent className="p-6 text-muted-foreground">Content repository coming soon.</ModernCardContent>
  </ModernCard>
);
const LearningPlans = () => (
  <ModernCard variant="glass">
    <ModernCardContent className="p-6 text-muted-foreground">Learning plans coming soon.</ModernCardContent>
  </ModernCard>
);

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState('overview');
  const statsQuery = useQuery({ queryKey: ['admin','stats'], queryFn: fetchAdminStats, refetchInterval: 60_000 });

  const exportEnrollments = async () => {
    try {
      const csv = await exportEnrollmentsCSV();
      downloadCSV('enrollments.csv', csv);
      toast({ title: 'Enrollment export generated' });
    } catch (e: any) {
      toast({ title: 'Export failed', description: e.message, variant: 'destructive' });
    }
  };

  if (profile && !(profile.role === 'admin' || profile.role === 'owner')) {
    return (
      <LMSLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          </div>
        </div>
      </LMSLayout>
    );
  }

  const stats = statsQuery.data || null;
  const loading = statsQuery.isLoading;
  const error = statsQuery.error as undefined | { message?: string };

  return (
    <LMSLayout>
      <div className="space-y-8">
        <ModernCard variant="glass">
          <ModernCardContent className="p-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Admin Dashboard</h1>
              <p className="text-muted-foreground text-lg mt-2">Manage your Solar Pros Hub LMS platform</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={exportEnrollments} disabled={statsQuery.isLoading}>Export Enrollments</Button>
            </div>
          </ModernCardContent>
        </ModernCard>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}
        {error && !loading && (
          <div className="p-4 border rounded-lg bg-destructive/10 text-destructive text-sm">Failed to load stats: {error?.message || 'Unknown error'}</div>
        )}
        {!loading && !error && <StatsOverview stats={stats} />}

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 h-16 bg-secondary/50 rounded-2xl p-2">
            <TabsTrigger value="overview" className="h-12 rounded-xl text-base"><BarChart3 className="h-4 w-4 mr-2"/>Overview</TabsTrigger>
            <TabsTrigger value="users" className="h-12 rounded-xl text-base"><Users className="h-4 w-4 mr-2"/>Users</TabsTrigger>
            <TabsTrigger value="courses" className="h-12 rounded-xl text-base"><BookOpen className="h-4 w-4 mr-2"/>Courses</TabsTrigger>
            <TabsTrigger value="teams" className="h-12 rounded-xl text-base"><Layers className="h-4 w-4 mr-2"/>Teams</TabsTrigger>
            <TabsTrigger value="repository" className="h-12 rounded-xl text-base"><FileText className="h-4 w-4 mr-2"/>Repository</TabsTrigger>
            <TabsTrigger value="plans" className="h-12 rounded-xl text-base"><Settings className="h-4 w-4 mr-2"/>Plans</TabsTrigger>
            <TabsTrigger value="analytics" className="h-12 rounded-xl text-base"><TrendingUp className="h-4 w-4 mr-2"/>Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <h2 className="text-2xl font-semibold">Overview</h2>
            <ModernCard variant="glass"><ModernCardContent className="p-6"><p className="text-muted-foreground">Select a section above to manage users, courses, and teams. Enhanced analytics coming soon.</p></ModernCardContent></ModernCard>
          </TabsContent>

          <TabsContent value="users" className="space-y-6"><UserManagement /></TabsContent>
          <TabsContent value="courses" className="space-y-6"><CourseManagement /></TabsContent>
          <TabsContent value="teams" className="space-y-6"><TeamManagementPanel /></TabsContent>
          <TabsContent value="repository" className="space-y-6"><ContentRepository /></TabsContent>
          <TabsContent value="plans" className="space-y-6"><LearningPlans /></TabsContent>
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-semibold">Analytics & Reports</h2>
            <ModernCard variant="glass"><ModernCardContent className="p-6"><p className="text-muted-foreground">Coming soon: activity timelines, funnels, progress distributions.</p></ModernCardContent></ModernCard>
          </TabsContent>
        </Tabs>
      </div>
    </LMSLayout>
  );
}