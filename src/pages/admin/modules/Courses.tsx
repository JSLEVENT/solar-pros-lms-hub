import { useState } from 'react';
import { useCourses } from '@/hooks/admin/useCourses';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function AdminCourses(){
  const { data, isLoading, isError, createMutation, updateMutation, deleteMutation } = useCourses();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title:'', description:'', category:'', level:'beginner', duration:'' });
  const [editing, setEditing] = useState<string|null>(null);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Courses</h1>
        <button onClick={()=> setCreating(c=>!c)} className="px-3 py-2 text-sm rounded bg-primary text-primary-foreground">{creating? 'Close':'New Course'}</button>
      </div>
      {creating && (
        <div className="border rounded-xl p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <Input placeholder="Title" value={form.title} onChange={e=> setForm(f=>({...f,title:e.target.value}))} />
            <Input placeholder="Category" value={form.category} onChange={e=> setForm(f=>({...f,category:e.target.value}))} />
          </div>
          <Textarea placeholder="Description" value={form.description} onChange={e=> setForm(f=>({...f,description:e.target.value}))} />
          <div className="grid md:grid-cols-3 gap-3">
            <select className="border rounded px-2 h-9 bg-background" value={form.level} onChange={e=> setForm(f=>({...f,level:e.target.value}))}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <Input placeholder="Duration" value={form.duration} onChange={e=> setForm(f=>({...f,duration:e.target.value}))} />
            <button
              disabled={createMutation.isPending || !form.title}
              onClick={()=> createMutation.mutate(form, { onSuccess: ()=> { setForm({ title:'', description:'', category:'', level:'beginner', duration:'' }); setCreating(false); } })}
              className="px-3 py-2 text-sm rounded bg-green-600 text-white disabled:opacity-50"
            >{createMutation.isPending? 'Saving...':'Save Course'}</button>
          </div>
        </div>
      )}
      {isLoading && <p className="text-sm text-muted-foreground">Loading courses…</p>}
      {isError && <p className="text-sm text-red-600">Failed to load courses</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(data||[]).map(c => (
          <div key={c.id} className="p-4 border rounded-xl space-y-2">
            <div className="flex justify-between items-start">
              <p className="font-medium line-clamp-1" title={c.title}>{c.title}</p>
              <Badge variant="outline" className="text-[10px] capitalize">{c.level}</Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{c.category || 'Uncategorized'}</p>
            <div className="flex gap-2 text-[10px] text-muted-foreground">
              <span>{c.status}</span>
              {c.duration && <span>• {c.duration}</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={()=> setEditing(editing===c.id? null : c.id)} className="text-xs px-2 py-1 rounded border">{editing===c.id? 'Close':'Edit'}</button>
              <button onClick={()=> deleteMutation.mutate(c.id)} className="text-xs px-2 py-1 rounded border">Delete</button>
            </div>
            {editing===c.id && (
              <div className="space-y-2 pt-2 border-t">
                <Input defaultValue={c.title} onBlur={e=> updateMutation.mutate({ id: c.id, data:{ title:e.target.value } })} />
                <Textarea defaultValue={c.description} onBlur={e=> updateMutation.mutate({ id: c.id, data:{ description:e.target.value } })} />
                <div className="grid grid-cols-3 gap-2">
                  <Input defaultValue={c.category} onBlur={e=> updateMutation.mutate({ id: c.id, data:{ category:e.target.value } })} />
                  <select defaultValue={c.level} onChange={e=> updateMutation.mutate({ id: c.id, data:{ level:e.target.value } })} className="border rounded px-2 h-9 bg-background">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  <Input defaultValue={c.duration||''} onBlur={e=> updateMutation.mutate({ id: c.id, data:{ duration:e.target.value } })} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {(data||[]).length===0 && !isLoading && <p className="text-sm text-muted-foreground">No courses.</p>}
    </div>
  );
}

