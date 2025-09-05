import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LMSLayout } from '@/components/LMSLayout';
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2, 
  Download,
  BarChart3,
  Shield,
  Settings,
  FileText,
  Award,
  Calendar,
  Mail,
  UserPlus,
  Layers
} from 'lucide-react';
import { ContentRepository } from '@/components/admin/ContentRepository';
import { LearningPlans } from '@/components/admin/LearningPlans';

interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalCertificates: number;
  activeUsers: number;
  completionRate: number;
  totalTeams?: number;
  totalManagers?: number;
}

interface User {
  id: string;
  user_id: string;
  full_name: string;
  role: string;
  created_at: string;
  organization_id?: string;
}

interface Course {
  id: string;
  title: string;
  category: string;
  level: string;
  // Pricing removed - internal platform
  status: string;
  instructor: { full_name: string };
  enrollment_count: number;
}

interface TeamSummary {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
  manager_count: number;
  managers: { user_id: string; full_name: string | null }[];
}

interface TeamAnalyticsRow {
  team_id: string | null;
  team_name: string | null;
  member_count: number | null;
  avg_progress: number | null;
  completed_courses: number | null;
  total_courses_assigned: number | null;
}

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [teamAnalytics, setTeamAnalytics] = useState<TeamAnalyticsRow[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Course Creation States
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    duration: '',
    // Pricing removed - internal platform
  });

  // User Management States
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'learner'
  });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (profile && (profile.role === 'admin' || profile.role === 'owner')) {
      fetchAdminData();
    }
  }, [profile]);

  // Realtime updates for live dashboard
  useEffect(() => {
    if (!profile || (profile.role !== 'admin' && profile.role !== 'owner')) return;
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchAdminData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => fetchAdminData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments' }, () => fetchAdminData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'certificates' }, () => fetchAdminData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => fetchAdminData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_memberships' }, () => fetchAdminData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'manager_teams' }, () => fetchAdminData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const fetchAdminData = async () => {
    try {
      // Fetch basic stats
      const [usersRes, coursesRes, enrollmentsRes, certificatesRes, teamsRes, managersRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('courses').select('*'),
        supabase.from('enrollments').select('*'),
        supabase.from('certificates').select('*'),
        supabase.from('teams').select('*'),
        supabase.from('profiles').select('user_id').eq('role', 'manager')
      ]);

      if (usersRes.error) throw usersRes.error;
      if (coursesRes.error) throw coursesRes.error;
      if (enrollmentsRes.error) throw enrollmentsRes.error;
      if (certificatesRes.error) throw certificatesRes.error;
      if (teamsRes.error) throw teamsRes.error;
      if (managersRes.error) throw managersRes.error;

      // Calculate stats
      const totalUsers = usersRes.data?.length || 0;
      const totalCourses = coursesRes.data?.length || 0;
      const totalEnrollments = enrollmentsRes.data?.length || 0;
      const totalCertificates = certificatesRes.data?.length || 0;
      const completedEnrollments = enrollmentsRes.data?.filter(e => e.status === 'completed').length || 0;
      const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

      // Active users heuristic: last_active_at within past 7 days
      const recentActive = (usersRes.data || []).filter((u: any) => {
        if (!u.last_active_at) return false;
        return new Date(u.last_active_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }).length;

      setStats({
        totalUsers,
        totalCourses,
        totalEnrollments,
        totalCertificates,
        activeUsers: recentActive,
        completionRate,
        totalTeams: teamsRes.data?.length || 0,
        totalManagers: managersRes.data?.length || 0
      });

      // Fetch detailed user data
      const { data: detailedUsers } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      setUsers(detailedUsers || []);

      // Fetch detailed course data with instructor and enrollment counts
      const { data: detailedCourses } = await supabase
        .from('courses')
        .select(`
          *,
          profiles:instructor_id (full_name),
          enrollments (count)
        `)
        .order('created_at', { ascending: false });

      setCourses(detailedCourses?.map(course => ({
        ...course,
        instructor: course.profiles,
        enrollment_count: course.enrollments?.[0]?.count || 0
      })) || []);

      // Fetch teams with member and manager counts
      const { data: teamsWithCounts, error: teamsWithCountsError } = await supabase
        .from('teams')
        .select(`
          id, name, description,
          team_memberships(count),
          manager_teams(manager_id)
        `)
        .order('created_at', { ascending: false });

      if (teamsWithCountsError) throw teamsWithCountsError;

      // Fetch manager profiles for display
      const managerIds = Array.from(new Set((teamsWithCounts || []).flatMap(t => (t.manager_teams || []).map((m: any) => m.manager_id)).filter(Boolean)));
      let managersMap: Record<string, { full_name: string | null }> = {};
      if (managerIds.length) {
        const { data: managersProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', managerIds as string[]);
        managersProfiles?.forEach(mp => { managersMap[mp.user_id] = { full_name: mp.full_name }; });
      }

      const formattedTeams: TeamSummary[] = (teamsWithCounts || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        member_count: t.team_memberships?.[0]?.count || 0,
        manager_count: (t.manager_teams || []).length,
        managers: (t.manager_teams || []).map((mt: any) => ({
          user_id: mt.manager_id,
          full_name: managersMap[mt.manager_id]?.full_name ?? null
        }))
      }));

      setTeams(formattedTeams);

      // Fetch analytics view
      const { data: ta } = await supabase
        .from('team_analytics')
        .select('*')
        .order('member_count', { ascending: false });
      setTeamAnalytics((ta || []) as TeamAnalyticsRow[]);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createCourse = async () => {
    if (!newCourse.title || !newCourse.description) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .insert({
          ...newCourse,
          instructor_id: user?.id,
          status: 'published'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Course created successfully',
      });

      setNewCourse({
        title: '',
        description: '',
        category: '',
        level: 'beginner',
        duration: '',
        // Pricing removed - internal platform
      });

      fetchAdminData();
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: 'Error',
        description: 'Failed to create course',
        variant: 'destructive',
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: 'owner' | 'admin' | 'manager' | 'learner') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });

      fetchAdminData();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const assignManagerToTeam = async (teamId: string, managerId: string) => {
    try {
      const { error } = await supabase
        .from('manager_teams')
        .insert({ team_id: teamId, manager_id: managerId, assigned_by: user?.id || null });
      if (error) throw error;
      toast({ title: 'Success', description: 'Manager assigned to team' });
      fetchAdminData();
    } catch (error) {
      console.error('Error assigning manager:', error);
      toast({ title: 'Error', description: 'Failed to assign manager', variant: 'destructive' });
    }
  };

  const removeManagerFromTeam = async (teamId: string, managerId: string) => {
    try {
      const { error } = await supabase
        .from('manager_teams')
        .delete()
        .match({ team_id: teamId, manager_id: managerId });
      if (error) throw error;
      toast({ title: 'Success', description: 'Manager removed from team' });
      fetchAdminData();
    } catch (error) {
      console.error('Error removing manager:', error);
      toast({ title: 'Error', description: 'Failed to remove manager', variant: 'destructive' });
    }
  };

  const exportData = async (type: string) => {
    try {
      let data: any[] = [];
      let filename = '';

      switch (type) {
        case 'users':
          data = users;
          filename = 'users-export.csv';
          break;
        case 'courses':
          data = courses;
          filename = 'courses-export.csv';
          break;
        case 'enrollments':
          const { data: enrollments } = await supabase
            .from('enrollments')
            .select(`
              *,
              profiles (full_name, email),
              courses (title)
            `);
          data = enrollments || [];
          filename = 'enrollments-export.csv';
          break;
        default:
          return;
      }

      // Simple CSV export
      const csvContent = [
        Object.keys(data[0] || {}).join(','),
        ...data.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: `${type} data exported successfully`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    }
  };

  const inviteUser = async () => {
    if (!newUser.email) {
      toast({ title: 'Error', description: 'Email is required', variant: 'destructive' });
      return;
    }
    try {
      setInviting(true);
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role
        }
      });
      if (error) throw error;
      toast({ title: 'Invitation sent', description: `Invite sent to ${newUser.email}` });
      setNewUser({ email: '', password: '', full_name: '', role: 'learner' });
      fetchAdminData();
    } catch (err) {
      console.error('Invite error', err);
      const message = (err as any)?.message || 'Failed to send invite';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setInviting(false);
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

  if (loading) {
    return (
      <LMSLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </LMSLayout>
    );
  }

  return (
    <LMSLayout>
      <div className="space-y-8">
        {/* Header */}
        <ModernCard variant="glass">
          <ModernCardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground text-lg mt-2">
                  Manage your Solar Pros Hub LMS platform
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => exportData('users')} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Users
                </Button>
                <Button onClick={() => exportData('courses')} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Courses
                </Button>
              </div>
            </div>
          </ModernCardContent>
        </ModernCard>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <ModernCard variant="floating">
              <ModernCardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  </div>
                </div>
              </ModernCardContent>
            </ModernCard>

            <ModernCard variant="floating">
              <ModernCardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-solar-red/20 to-solar-red/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-solar-red" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Courses</p>
                    <p className="text-2xl font-bold">{stats.totalCourses}</p>
                  </div>
                </div>
              </ModernCardContent>
            </ModernCard>

            <ModernCard variant="floating">
              <ModernCardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Enrollments</p>
                    <p className="text-2xl font-bold">{stats.totalEnrollments}</p>
                  </div>
                </div>
              </ModernCardContent>
            </ModernCard>

            <ModernCard variant="floating">
              <ModernCardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-solar-glow/20 to-solar-glow/10 flex items-center justify-center">
                    <Award className="h-6 w-6 text-solar-glow" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                    <p className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</p>
                  </div>
                </div>
              </ModernCardContent>
            </ModernCard>

            <ModernCard variant="floating">
              <ModernCardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center">
                    <Layers className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Teams</p>
                    <p className="text-2xl font-bold">{stats.totalTeams}</p>
                  </div>
                </div>
              </ModernCardContent>
            </ModernCard>

            <ModernCard variant="floating">
              <ModernCardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Managers</p>
                    <p className="text-2xl font-bold">{stats.totalManagers}</p>
                  </div>
                </div>
              </ModernCardContent>
            </ModernCard>
          </div>
        )}

        {/* Admin Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 h-16 bg-secondary/50 rounded-2xl p-2">
            <TabsTrigger value="overview" className="h-12 rounded-xl text-base">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="h-12 rounded-xl text-base">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="courses" className="h-12 rounded-xl text-base">
              <BookOpen className="h-4 w-4 mr-2" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="teams" className="h-12 rounded-xl text-base">
              <Layers className="h-4 w-4 mr-2" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="repository" className="h-12 rounded-xl text-base">
              <FileText className="h-4 w-4 mr-2" />
              Repository
            </TabsTrigger>
            <TabsTrigger value="plans" className="h-12 rounded-xl text-base">
              <Settings className="h-4 w-4 mr-2" />
              Plans
            </TabsTrigger>
            <TabsTrigger value="analytics" className="h-12 rounded-xl text-base">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">User Management</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                    <Input
                      placeholder="Full Name"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    />
          <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
            <SelectItem value="learner">Learner</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button className="w-full" onClick={inviteUser} disabled={inviting}>
                      {inviting ? 'Sending invite…' : 'Send Invite'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <ModernCard variant="glass">
              <ModernCardContent className="p-6">
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{user.full_name || `User ${user.user_id}`}</p>
                        <p className="text-sm text-muted-foreground">ID: {user.user_id}</p>
                        <Badge variant="outline" className="mt-1">
                          {user.role}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Select value={user.role} onValueChange={(value: 'owner' | 'admin' | 'manager' | 'learner') => updateUserRole(user.user_id, value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="learner">Learner</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="owner">Owner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </ModernCardContent>
            </ModernCard>
          </TabsContent>

          <TabsContent value="teams" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Team Management</h2>
              <Badge variant="secondary">{stats?.totalTeams || 0} teams • {stats?.totalManagers || 0} managers</Badge>
            </div>
            <div className="flex justify-end -mt-4">
              <Button asChild variant="outline">
                <Link to="/admin/teams">Open Teams Page</Link>
              </Button>
            </div>
            <ModernCard variant="glass">
              <ModernCardContent className="p-6 space-y-4">
                {teams.map((team) => (
                  <div key={team.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <p className="text-sm text-muted-foreground">{team.description || 'No description'}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{team.member_count} members</Badge>
                          <Badge variant="outline">{team.manager_count} managers</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Managers</p>
                      <div className="flex flex-wrap gap-2">
                        {team.managers.map((m) => (
                          <Badge key={m.user_id} variant="secondary" className="flex items-center gap-2">
                            {m.full_name || m.user_id}
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6 ml-1"
                              onClick={() => removeManagerFromTeam(team.id, m.user_id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                        {team.managers.length === 0 && (
                          <span className="text-sm text-muted-foreground">No managers assigned</span>
                        )}
                      </div>
                      <div className="mt-3 max-w-xs">
                        <AssignManagerSelect onAssign={(managerId) => assignManagerToTeam(team.id, managerId)} />
                      </div>
                    </div>
                  </div>
                ))}
                {teams.length === 0 && (
                  <p className="text-muted-foreground">No teams yet. Create teams from the Teams page.</p>
                )}
              </ModernCardContent>
            </ModernCard>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Course Management</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Course Title"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    />
                    <Textarea
                      placeholder="Course Description"
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Category"
                        value={newCourse.category}
                        onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                      />
                      <Select value={newCourse.level} onValueChange={(value) => setNewCourse({ ...newCourse, level: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Duration (e.g., 4 weeks)"
                        value={newCourse.duration}
                        onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                      />
                      {/* Price input removed - internal platform */}
                    </div>
                    <Button onClick={createCourse} className="w-full">Create Course</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <ModernCard variant="glass">
              <ModernCardContent className="p-6">
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{course.title}</p>
                        <p className="text-sm text-muted-foreground">{course.category} • {course.level}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{course.enrollment_count} enrolled</Badge>
                          {/* Pricing removed - internal platform */}
                          <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                            {course.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ModernCardContent>
            </ModernCard>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-semibold">Analytics & Reports</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ModernCard variant="glass">
                <ModernCardHeader>
                  <ModernCardTitle>User Activity</ModernCardTitle>
                </ModernCardHeader>
                <ModernCardContent>
                  <p className="text-muted-foreground">Coming soon: activity timelines and funnels</p>
                </ModernCardContent>
              </ModernCard>

              <ModernCard variant="glass">
                <ModernCardHeader>
                  <ModernCardTitle>Team Analytics</ModernCardTitle>
                </ModernCardHeader>
                <ModernCardContent>
                  <div className="space-y-3">
                    {teamAnalytics.slice(0, 8).map((t) => (
                      <div key={t.team_id || Math.random()} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{t.team_name || 'Team'}</p>
                          <p className="text-sm text-muted-foreground">{t.member_count || 0} members • Avg progress {(t.avg_progress || 0).toFixed(0)}%</p>
                        </div>
                        <Badge variant="outline">{t.completed_courses || 0} completed</Badge>
                      </div>
                    ))}
                    {teamAnalytics.length === 0 && (
                      <p className="text-muted-foreground">No analytics yet.</p>
                    )}
                  </div>
                </ModernCardContent>
              </ModernCard>
            </div>
          </TabsContent>

          <TabsContent value="repository" className="space-y-6">
            <ContentRepository />
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <LearningPlans />
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <h2 className="text-2xl font-semibold">System Overview</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ModernCard variant="glass">
                <ModernCardHeader>
                  <ModernCardTitle>Recent Activity</ModernCardTitle>
                </ModernCardHeader>
                <ModernCardContent>
                  <p className="text-muted-foreground">Recent user registrations, course enrollments, and completions</p>
                </ModernCardContent>
              </ModernCard>

              <ModernCard variant="glass">
                <ModernCardHeader>
                  <ModernCardTitle>System Health</ModernCardTitle>
                </ModernCardHeader>
                <ModernCardContent>
                  <p className="text-muted-foreground">Server status, database performance, and system metrics</p>
                </ModernCardContent>
              </ModernCard>

              <ModernCard variant="glass">
                <ModernCardHeader>
                  <ModernCardTitle>Quick Actions</ModernCardTitle>
                </ModernCardHeader>
                <ModernCardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Announcement
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Webinar
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </ModernCardContent>
              </ModernCard>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </LMSLayout>
  );
}

// Lightweight manager assign selector (local to this file)
function AssignManagerSelect({ onAssign }: { onAssign: (managerId: string) => void }) {
  const [managers, setManagers] = useState<{ user_id: string; full_name: string | null }[]>([]);
  useEffect(() => {
    const loadManagers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('role', 'manager');
      setManagers(data || []);
    };
    loadManagers();
  }, []);
  return (
    <Select onValueChange={(val) => onAssign(val)}>
      <SelectTrigger>
        <SelectValue placeholder="Assign manager" />
      </SelectTrigger>
      <SelectContent>
        {managers.map((m) => (
          <SelectItem key={m.user_id} value={m.user_id}>
            {m.full_name || m.user_id}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}