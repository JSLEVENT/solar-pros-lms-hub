import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LMSLayout } from '@/components/LMSLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { BookOpen, PlayCircle } from 'lucide-react';

// Data model types
export interface Course {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  courses?: Course;
}

const MyTraining = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  useEffect(()=>{ if(user) fetchData(); },[user]);

  async function fetchData(){
    if(!user) return;
    try {
      setLoading(true); setError(null);
      const { data, error: qErr } = await supabase
        .from('enrollments')
        .select('id,user_id,course_id,status,progress,courses(id,title,description,level)')
        .eq('user_id', user.id)
        .order('created_at',{ ascending:false });
      if(qErr) throw qErr;
      setEnrollments((data||[]) as Enrollment[]);
    } catch(e:any){
      console.error(e);
      setError('Failed to load enrolled courses');
      toast({ title:'Error', description:'Failed to load enrolled courses', variant:'destructive' });
    } finally { setLoading(false); }
  }

  const statusBadge = (status: Enrollment['status']) => {
    const base='px-2 py-0.5 rounded text-[10px] font-medium';
    if(status==='completed') return <span className={base + ' bg-green-100 text-green-800'}>Completed</span>;
    if(status==='in_progress') return <span className={base + ' bg-blue-100 text-blue-800'}>In Progress</span>;
    return <span className={base + ' bg-gray-100 text-gray-800'}>Not Started</span>;
  };

  if(loading){
    return <LMSLayout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div></div></LMSLayout>;
  }

  const total = enrollments.length;
  const completedCount = enrollments.filter(e=> e.status==='completed').length;
  const inProgressCount = enrollments.filter(e=> e.status==='in_progress').length;
  const notStartedCount = enrollments.filter(e=> e.status==='not_started').length;
  const avgProgress = total ? Math.round(enrollments.reduce((a,e)=> a + (e.progress||0),0)/total) : 0;

  return (
    <LMSLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Training</h1>
          <p className="text-muted-foreground">Your enrolled courses and progress</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4 max-w-xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-6 mt-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <Stat label="Enrolled" value={total} />
              <Stat label="Avg Progress" value={avgProgress + '%'} />
              <Stat label="Active" value={inProgressCount} />
              <Stat label="Completed" value={completedCount} />
              <Stat label="Not Started" value={notStartedCount} />
            </div>
            {!error && total===0 && <div className="border rounded-lg p-6 text-sm text-muted-foreground">You have no course enrollments yet.</div>}
            {total>0 && (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {enrollments.slice(0,6).map(en=> (
                  <Card key={en.id} className="flex flex-col">
                    <CardHeader className="flex-1">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <CardTitle className="line-clamp-1">{en.courses?.title || 'Untitled Course'}</CardTitle>
                          <CardDescription className="line-clamp-2 mt-1">{en.courses?.description || 'No description provided.'}</CardDescription>
                        </div>
                        {statusBadge(en.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Progress value={en.progress||0} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{en.progress||0}% complete</span>
                        {en.courses?.level && <span className="uppercase">{en.courses.level}</span>}
                      </div>
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link to={`/course/${en.courses?.id || en.course_id}`}><BookOpen className="h-4 w-4 mr-1" /> View</Link>
                        </Button>
                        <Button asChild size="sm" className="flex-1">
                          <Link to={`/course/${en.courses?.id || en.course_id}`}><PlayCircle className="h-4 w-4 mr-1" /> {en.status==='completed'? 'Review':'Start'}</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="courses" className="mt-4 space-y-4">
            {total===0 && <div className="border rounded-lg p-6 text-sm text-muted-foreground">No courses yet.</div>}
            {total>0 && (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {enrollments.map(en=> (
                  <Card key={en.id} className="flex flex-col">
                    <CardHeader className="flex-1">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <CardTitle className="line-clamp-1">{en.courses?.title || 'Untitled Course'}</CardTitle>
                          <CardDescription className="line-clamp-2 mt-1">{en.courses?.description || 'No description provided.'}</CardDescription>
                        </div>
                        {statusBadge(en.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Progress value={en.progress||0} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{en.progress||0}% complete</span>
                        {en.courses?.level && <span className="uppercase">{en.courses.level}</span>}
                      </div>
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link to={`/course/${en.courses?.id || en.course_id}`}><BookOpen className="h-4 w-4 mr-1" /> View</Link>
                        </Button>
                        <Button asChild size="sm" className="flex-1">
                          <Link to={`/course/${en.courses?.id || en.course_id}`}><PlayCircle className="h-4 w-4 mr-1" /> {en.status==='completed'? 'Review':'Start'}</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="plans" className="mt-4">
            <div className="border rounded-lg p-6 text-sm text-muted-foreground">Learning plans coming soon.</div>
          </TabsContent>
            <TabsContent value="assessments" className="mt-4">
            <div className="border rounded-lg p-6 text-sm text-muted-foreground">Assessments coming soon.</div>
          </TabsContent>
        </Tabs>
      </div>
    </LMSLayout>
  );
};

function Stat({ label, value }:{ label:string; value: string|number }){
  return (
    <div className="px-4 py-3 rounded-lg bg-muted/40 flex flex-col min-w-[110px]">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold">{value}</span>
    </div>
  );
}

export default MyTraining;