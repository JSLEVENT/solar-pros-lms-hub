import { useState } from 'react';
import { usePaginatedCourses } from '@/hooks/admin/usePaginatedCourses';
import { useCourses } from '@/hooks/admin/useCourses';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ModernCard, ModernCardContent } from '@/components/ui/modern-card';
import { Download, Plus, Edit, Trash2, Paperclip } from 'lucide-react';
import { exportCoursesCSV, downloadCSV } from '@/lib/admin/queries';
import { useToast } from '@/hooks/use-toast';
import { CourseContentManager } from '@/components/admin/CourseContentManager';

export function CourseManagement(){
  const { toast } = useToast();
  const { data: pageData, isLoading, page, setPage, pageSize } = usePaginatedCourses(25);
  const { createMutation, updateMutation, deleteMutation } = useCourses();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title:'', description:'', category:'', level:'beginner', duration:'' });
  const [attachFor, setAttachFor] = useState<string|null>(null);

  const create = () => {
    if(!form.title || !form.description){ toast({ title:'Missing fields', variant:'destructive'}); return; }
    createMutation.mutate(form, { onSuccess: ()=> { setForm({ title:'', description:'', category:'', level:'beginner', duration:'' }); setOpen(false); toast({ title:'Course created'}); } });
  };

  const exportCSV = async () => {
    try { const csv = await exportCoursesCSV(); downloadCSV('courses.csv', csv); toast({ title:'Export generated'}); } catch(e:any){ toast({ title:'Export failed', description:e.message, variant:'destructive'}); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Course Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2"/>Export CSV</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2"/>Create Course</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Create Course</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Title" value={form.title} onChange={e=> setForm(f=>({...f,title:e.target.value}))}/>
                <Textarea placeholder="Description" value={form.description} onChange={e=> setForm(f=>({...f,description:e.target.value}))}/>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Category" value={form.category} onChange={e=> setForm(f=>({...f,category:e.target.value}))}/>
                  <Select value={form.level} onValueChange={v=> setForm(f=>({...f,level:v}))}>
                    <SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input placeholder="Duration" value={form.duration} onChange={e=> setForm(f=>({...f,duration:e.target.value}))}/>
                <Button disabled={createMutation.isPending} onClick={create}>{createMutation.isPending? 'Creating...' : 'Create'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <ModernCard variant="glass">
        <ModernCardContent className="p-6 space-y-4">
          {isLoading && <p className="text-muted-foreground">Loading courses...</p>}
          {pageData?.data?.map((c:any)=> (
            <div key={c.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-sm text-muted-foreground">{c.category} • {c.level}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{c.duration || 'N/A'}</Badge>
                  <Badge variant={c.status==='published'? 'default':'secondary'}>{c.status}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled><Edit className="h-4 w-4"/></Button>
                <Button variant="outline" size="sm" onClick={()=> deleteMutation.mutate(c.id)}><Trash2 className="h-4 w-4"/></Button>
                <Dialog open={attachFor===c.id} onOpenChange={(o)=> setAttachFor(o? c.id : null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm"><Paperclip className="h-4 w-4 mr-1"/>Attach</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Attach Content to {c.title}</DialogTitle>
                    </DialogHeader>
                    <CourseContentManager courseId={c.id} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2">
            <Button variant="outline" size="sm" disabled={page===0} onClick={()=> setPage(p=> Math.max(0,p-1))}>Prev</Button>
            <p className="text-xs text-muted-foreground">Page {page+1}</p>
            <Button variant="outline" size="sm" disabled={(pageData?.data?.length||0) < pageSize} onClick={()=> setPage(p=> p+1)}>Next</Button>
          </div>
        </ModernCardContent>
      </ModernCard>
    </div>
  );
}
