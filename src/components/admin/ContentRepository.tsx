import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from '@/components/ui/modern-card';
import { useToast } from '@/hooks/use-toast';
import { FolderPlus, Upload, RefreshCcw } from 'lucide-react';

interface Folder { id: string; name: string; parent_id: string | null; }
interface Asset { id: string; title: string; description?: string | null; content_type: string | null; folder_id: string | null; external_url: string | null; file_path: string | null; created_at: string; }
interface Tag { id: string; name: string; }

export const ContentRepository = () => {
  const { toast } = useToast();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newAsset, setNewAsset] = useState({ title: '', description: '', external_url: '', content_type: 'video', file: null as File | null, tags: [] as string[] });
  const [editing, setEditing] = useState<Asset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [assetTags, setAssetTags] = useState<Record<string,string[]>>({});
  const [preview, setPreview] = useState<Asset | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 24;
  const [total, setTotal] = useState(0);

  useEffect(() => { refreshAll(); }, []);
  useEffect(()=> { const t = setTimeout(()=> setDebouncedSearch(search.trim().toLowerCase()), 300); return ()=> clearTimeout(t); }, [search]);
  useEffect(()=> { fetchAssets(); }, [selectedFolder, debouncedSearch, activeTag]);

  const refreshAll = async () => {
    await Promise.all([fetchFolders(), fetchAssets(), fetchTags()]);
  };
  const fetchFolders = async () => {
    try {
  const { data, error } = await (supabase as any).from('content_folders').select('*').order('name');
      if (error) throw error;
      setFolders(data || []);
    } catch (e: any) {
      if (e.message?.includes('relation') || e.code === '42P01') {
        // Table not migrated yet
        setFolders([]);
      } else {
        console.error(e);
      }
    }
  };
  const fetchAssets = async () => {
    try {
      let query = (supabase as any).from('content_assets').select('*', { count:'exact' }).order('created_at', { ascending: false });
      if (selectedFolder) query = query.eq('folder_id', selectedFolder);
      if (debouncedSearch) query = query.ilike('title', `%${debouncedSearch}%`);
      const from = page*pageSize; const to = from + pageSize - 1;
      const { data, error, count } = await query.range(from,to);
      if (error) throw error;
      const list = data || [];
      setAssets(list);
      setTotal(count||0);
      if (list.length) {
        const ids = list.map(a=> a.id);
        const { data: tagMap } = await (supabase as any)
          .from('content_asset_tags')
          .select('asset_id, content_tags(name)')
          .in('asset_id', ids);
        const map: Record<string,string[]> = {};
        (tagMap||[]).forEach((r:any)=> { map[r.asset_id] = map[r.asset_id] || []; if (r.content_tags?.name) map[r.asset_id].push(r.content_tags.name); });
        setAssetTags(map);
      } else {
        setAssetTags({});
      }
    } catch (e: any) {
      if (e.message?.includes('relation') || e.code === '42P01') {
        setAssets([]);
      } else {
        console.error(e);
      }
    }
  };
  const fetchTags = async () => {
    try {
  const { data, error } = await (supabase as any).from('content_tags').select('*').order('name');
      if (error) throw error;
      setTags(data || []);
    } catch (e: any) {
      if (e.message?.includes('relation') || e.code === '42P01') {
        setTags([]);
      } else {
        console.error(e);
      }
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
  const { error } = await (supabase as any).from('content_folders').insert({ name: newFolderName, parent_id: selectedFolder });
    setCreatingFolder(false);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    setNewFolderName('');
    fetchFolders();
  };

  const ensureTags = async (names: string[]) => {
    if (!names.length) return [] as string[];
    const lower = names.map(n => n.toLowerCase());
  const existing = ((await (supabase as any).from('content_tags').select('*').in('name', lower)).data) || [];
    const toCreate = lower.filter(n => !existing.find(e => e.name.toLowerCase() === n));
    if (toCreate.length) {
  const { data: inserted } = await (supabase as any).from('content_tags').insert(toCreate.map(name => ({ name }))).select('*');
      return [...existing, ...(inserted || [])].map(t => t.id);
    }
    return existing.map(t => t.id);
  };

  const uploadAsset = async () => {
    if (!newAsset.title.trim()) return toast({ title: 'Error', description: 'Title required', variant: 'destructive' });
    setUploading(true);
    try {
      let file_path: string | null = null;
      if (newAsset.file) {
        const path = `${Date.now()}_${newAsset.file.name}`;
        const { error: upErr } = await supabase.storage.from('assets').upload(path, newAsset.file, { upsert: false });
        if (upErr) throw upErr;
        file_path = path;
      }
      const tagIds = await ensureTags(newAsset.tags);
  const { data: inserted, error } = await (supabase as any).from('content_assets').insert({
        title: newAsset.title,
        description: newAsset.description || null,
        external_url: newAsset.external_url || null,
        content_type: newAsset.content_type,
        folder_id: selectedFolder,
        file_path
      }).select('*').single();
      if (error) throw error;
      if (inserted && tagIds.length) {
  await (supabase as any).from('content_asset_tags').insert(tagIds.map((id: string) => ({ asset_id: inserted.id, tag_id: id })));
      }
      toast({ title: 'Asset added' });
      setNewAsset({ title: '', description: '', external_url: '', content_type: 'video', file: null, tags: [] });
      fetchAssets();
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const updateAsset = async () => {
    if (!editing) return;
  const { error } = await (supabase as any).from('content_assets').update({
      title: editing.title,
      description: editing.description,
      external_url: editing.external_url,
      content_type: editing.content_type
    }).eq('id', editing.id);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    setEditing(null);
    fetchAssets();
  };

  const deleteAsset = async (id: string) => {
  const { error } = await (supabase as any).from('content_assets').delete().eq('id', id);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    fetchAssets();
  };

  const currentPath = (() => {
    if (!selectedFolder) return [] as Folder[];
    const map = new Map<string, Folder>(folders.map(f => [f.id, f]));
    const chain: Folder[] = [];
    let cursor: Folder | null = map.get(selectedFolder) || null;
    while (cursor) {
      chain.unshift(cursor);
      cursor = cursor.parent_id ? map.get(cursor.parent_id) || null : null;
    }
    return chain;
  })();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-2xl font-semibold">Content Repository</h3>
        <div className="flex gap-2 items-center flex-wrap">
          <Input placeholder="Search assets" value={search} onChange={e=> setSearch(e.target.value)} className="w-56" />
          <Button variant="outline" onClick={refreshAll} size="sm"><RefreshCcw className="h-4 w-4 mr-1" />Refresh</Button>
        </div>
      </div>

      {currentPath.length > 0 && (
        <div className="text-xs flex flex-wrap gap-1">
          <button className="underline" onClick={()=> { setSelectedFolder(null); fetchAssets(); }}>Root</button>
          {currentPath.map((f,i)=> (
            <span key={f.id}>
              <span className="mx-1">/</span>
              <button className="underline" onClick={()=> { setSelectedFolder(f.id); fetchAssets(); }}>{f.name}</button>
            </span>
          ))}
        </div>
      )}

  <ModernCard variant="glass">
        <ModernCardHeader>
          <ModernCardTitle>Folders</ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent className="space-y-4">
          {folders.length === 0 && (
            <p className="text-xs text-muted-foreground">No folders or repository tables not migrated yet.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant={selectedFolder === null ? 'default' : 'outline'} size="sm" onClick={() => { setSelectedFolder(null); }}>All ({assets.length})</Button>
            {folders.map(f => {
              const count = assets.filter(a=> a.folder_id === f.id).length;
              return (
                <Button key={f.id} variant={selectedFolder === f.id ? 'default' : 'outline'} size="sm" onClick={() => { setSelectedFolder(f.id); }}>{f.name}{count? ` (${count})`:''}</Button>
              );
            })}
          </div>
          {tags.length>0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground mr-1">Tags:</span>
              <button onClick={()=> setActiveTag(null)} className={`text-[11px] px-2 py-0.5 rounded border ${!activeTag? 'bg-primary text-primary-foreground border-primary':'hover:bg-accent'}`}>All</button>
              {tags.map(t=> (
                <button key={t.id} onClick={()=> setActiveTag(activeTag===t.name? null : t.name)} className={`text-[11px] px-2 py-0.5 rounded border ${activeTag===t.name? 'bg-primary text-primary-foreground border-primary':'hover:bg-accent'}`}>{t.name}</button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input placeholder="New folder name" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} />
            <Button onClick={createFolder} disabled={!newFolderName || creatingFolder} size="sm"><FolderPlus className="h-4 w-4 mr-1" />Create</Button>
          </div>
        </ModernCardContent>
      </ModernCard>

  <ModernCard variant="glass">
        <ModernCardHeader>
          <ModernCardTitle>Add Asset</ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input placeholder="Title" value={newAsset.title} onChange={e => setNewAsset(a => ({ ...a, title: e.target.value }))} />
            <Select value={newAsset.content_type} onValueChange={v => setNewAsset(a => ({ ...a, content_type: v }))}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="doc">Document</SelectItem>
                <SelectItem value="link">Link</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea placeholder="Description" value={newAsset.description} onChange={e => setNewAsset(a => ({ ...a, description: e.target.value }))} />
          <Input placeholder="External URL (YouTube, etc)" value={newAsset.external_url} onChange={e => setNewAsset(a => ({ ...a, external_url: e.target.value }))} />
          <Input type="file" onChange={e => setNewAsset(a => ({ ...a, file: e.target.files?.[0] || null }))} />
          <Input placeholder="Tags (comma separated)" value={newAsset.tags.join(',')} onChange={e => setNewAsset(a => ({ ...a, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))} />
          <Button onClick={uploadAsset} disabled={uploading}><Upload className="h-4 w-4 mr-2" />{uploading ? 'Uploading...' : 'Add Asset'}</Button>
        </ModernCardContent>
      </ModernCard>

      <ModernCard variant="glass">
        <ModernCardHeader>
          <ModernCardTitle>Assets {selectedFolder ? '(Filtered)' : ''}</ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent className="space-y-4">
          {assets.filter(a=> !activeTag || (assetTags[a.id]||[]).includes(activeTag)).length === 0 && <p className="text-sm text-muted-foreground">No assets{debouncedSearch? ' matching search':''}{activeTag? ` with tag ${activeTag}`:''}.</p>}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.filter(a=> !activeTag || (assetTags[a.id]||[]).includes(activeTag)).map(a => (
              <div key={a.id} className="p-4 border rounded-xl space-y-2 group cursor-pointer" onClick={()=> setPreview(a)}>
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate" title={a.title}>{a.title}</p>
                    {a.description && <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>}
                    {assetTags[a.id] && assetTags[a.id].length>0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {assetTags[a.id].map(t=> <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground/90">{t}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge variant="outline" className="text-xs capitalize">{a.content_type || 'asset'}</Badge>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e)=> { e.stopPropagation(); setEditing(a); }} className="text-[10px] px-2 py-0.5 rounded border">Edit</button>
                      <button onClick={(e)=> { e.stopPropagation(); deleteAsset(a.id); }} className="text-[10px] px-2 py-0.5 rounded border text-red-600">Del</button>
                    </div>
                  </div>
                </div>
                {a.external_url && <a className="text-xs text-primary underline" href={a.external_url} target="_blank" rel="noreferrer" onClick={e=> e.stopPropagation()}>Open Link</a>}
                {a.file_path && <p className="text-xs text-muted-foreground">Stored: {a.file_path}</p>}
                <p className="text-[11px] text-muted-foreground">Created {new Date(a.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
          {editing && (
            <div className="border rounded-xl p-4 space-y-3">
              <p className="font-medium text-sm">Edit Asset</p>
              <Input value={editing.title} onChange={e=> setEditing(ed=> ed? {...ed, title:e.target.value }: ed)} />
              <Textarea value={editing.description||''} onChange={e=> setEditing(ed=> ed? {...ed, description:e.target.value }: ed)} />
              <Input value={editing.external_url||''} onChange={e=> setEditing(ed=> ed? {...ed, external_url:e.target.value }: ed)} placeholder="External URL" />
              <Select value={editing.content_type||'asset'} onValueChange={v=> setEditing(ed=> ed? {...ed, content_type:v }: ed)}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="doc">Document</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button size="sm" onClick={updateAsset}>Save</Button>
                <Button size="sm" variant="outline" onClick={()=> setEditing(null)}>Cancel</Button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 text-xs">
            <span>{total===0? '0 items': `${page*pageSize+1}-${Math.min((page+1)*pageSize,total)} of ${total}`}</span>
            <div className="flex gap-2">
              <button disabled={page===0} onClick={()=> { setPage(p=> Math.max(0,p-1)); }} className="px-2 py-1 border rounded disabled:opacity-40">Prev</button>
              <button disabled={(page+1)*pageSize >= total} onClick={()=> { setPage(p=> p+1); }} className="px-2 py-1 border rounded disabled:opacity-40">Next</button>
            </div>
          </div>
        </ModernCardContent>
      </ModernCard>
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={()=> setPreview(null)}>
          <div className="bg-background w-full max-w-lg rounded-xl shadow-xl p-6 space-y-4 relative" onClick={e=> e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-xs px-2 py-1 border rounded" onClick={()=> setPreview(null)}>Close</button>
            <h4 className="text-lg font-semibold">{preview.title}</h4>
            {preview.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{preview.description}</p>}
            {assetTags[preview.id] && assetTags[preview.id].length>0 && (
              <div className="flex flex-wrap gap-1">
                {assetTags[preview.id].map(t=> <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-accent text-accent-foreground/90">{t}</span>)}
              </div>
            )}
            {preview.external_url && <a href={preview.external_url} target="_blank" rel="noreferrer" className="text-primary underline text-sm">Open External Resource</a>}
            {preview.file_path && <p className="text-xs text-muted-foreground">Stored path: {preview.file_path}</p>}
            <div className="text-xs text-muted-foreground">Created {new Date(preview.created_at).toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
};
