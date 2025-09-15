import { useEffect, useMemo, useState } from 'react';
import { useCourseAssets } from '@/hooks/admin/useCourseAssets';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Asset = { id:string; title:string; content_type?:string|null; description?:string|null; created_at?:string };

export function CourseContentManager({ courseId }: { courseId: string }){
  const { data, isLoading, attach, detach } = useCourseAssets(courseId);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('all');
  const [selected, setSelected] = useState<string[]>([]);

  const attachedIds = useMemo(()=> new Set((data||[]).map((r:any)=> r.asset_id)), [data]);

  useEffect(()=>{ (async()=>{
    try {
      let query: any = (supabase as any).from('content_assets' as any).select('*' as any).order('created_at', { ascending:false });
      const { data: rows } = await query.limit(200);
      setAllAssets(rows||[]);
    } catch { setAllAssets([]); }
  })(); },[courseId]);

  const filtered = useMemo(()=> {
    return allAssets.filter(a=> {
      if (attachedIds.has(a.id)) return false;
      const bySearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
      const byType = type==='all' || (a.content_type||'').toLowerCase()===type;
      return bySearch && byType;
    });
  },[allAssets, search, type, attachedIds]);

  const attachSelected = async ()=>{
    if (!selected.length) return;
    await attach.mutateAsync(selected);
    setSelected([]);
  };

  return (
    <div className="space-y-3">
      <div className="text-sm">
        <p className="font-medium">Attached Content</p>
        {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
        {!isLoading && (data||[]).length===0 && <p className="text-xs text-muted-foreground">No content attached yet.</p>}
        <div className="space-y-2">
          {(data||[]).map((r:any)=> (
            <div key={r.asset_id} className="flex items-center justify-between p-2 border rounded">
              <div className="min-w-0">
                <p className="text-sm truncate" title={r.asset?.title}>{r.asset?.title||'Untitled asset'}</p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Badge variant="outline" className="capitalize">{r.asset?.content_type||'asset'}</Badge>
                  <span>Position {r.position||'-'}</span>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={()=> detach.mutate(r.asset_id)}>Remove</Button>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 space-y-2">
        <p className="font-medium text-sm">Add Content</p>
        <div className="flex items-center gap-2">
          <Input placeholder="Search assets" value={search} onChange={e=> setSearch(e.target.value)} className="h-8" />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="doc">Document</SelectItem>
              <SelectItem value="link">Link</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="max-h-64 overflow-auto border rounded">
          {filtered.map(a=> {
            const checked = selected.includes(a.id);
            return (
              <label key={a.id} className="flex items-center gap-2 p-2 border-b last:border-b-0 cursor-pointer">
                <input type="checkbox" checked={checked} onChange={e=> {
                  const next = e.target.checked ? [...selected, a.id] : selected.filter(id=> id!==a.id);
                  setSelected(next);
                }} />
                <span className="text-sm truncate" title={a.title}>{a.title}</span>
                <Badge variant="outline" className="ml-auto text-[10px] capitalize">{a.content_type||'asset'}</Badge>
              </label>
            );
          })}
          {filtered.length===0 && (<p className="text-xs text-muted-foreground p-2">No assets available.</p>)}
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={attachSelected} disabled={attach.isPending || selected.length===0}>{attach.isPending? 'Attaching…':'Attach Selected'}</Button>
        </div>
      </div>
    </div>
  );
}
