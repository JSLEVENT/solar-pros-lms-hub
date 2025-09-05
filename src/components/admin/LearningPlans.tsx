import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from '@/components/ui/modern-card';
import { useToast } from '@/hooks/use-toast';
import { Plus, GripVertical, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface Plan { id: string; name: string; description: string | null; }
interface Asset { id: string; title: string; }
interface Course { id: string; title: string; }
interface Item { id: string; item_type: string; position: number; asset_id: string | null; course_id: string | null; }

export const LearningPlans = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [newPlan, setNewPlan] = useState({ name: '', description: '' });
  const [newItem, setNewItem] = useState({ type: 'asset', asset_id: '', course_id: '' });

  useEffect(() => { loadReference(); loadPlans(); }, []);
  useEffect(() => { if (selectedPlan) loadItems(selectedPlan.id); }, [selectedPlan]);

  const loadReference = async () => {
    const [{ data: a }, { data: c }] = await Promise.all([
      supabase.from('content_assets').select('id, title').order('title'),
      supabase.from('courses').select('id, title').order('title')
    ]);
    setAssets(a || []);
    setCourses(c || []);
  };
  const loadPlans = async () => {
    const { data } = await supabase.from('learning_plans').select('*').order('created_at', { ascending: false });
    setPlans(data || []);
  };
  const loadItems = async (planId: string) => {
    const { data } = await supabase.from('learning_plan_items').select('*').eq('plan_id', planId).order('position');
    setItems(data || []);
  };

  const createPlan = async () => {
    if (!newPlan.name.trim()) return;
    const { error } = await supabase.from('learning_plans').insert({ name: newPlan.name, description: newPlan.description || null });
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    setNewPlan({ name: '', description: '' });
    loadPlans();
  };

  const addItem = async () => {
    if (!selectedPlan) return;
    if (newItem.type === 'asset' && !newItem.asset_id) return;
    if (newItem.type === 'course' && !newItem.course_id) return;
    const insert: any = { plan_id: selectedPlan.id, item_type: newItem.type };
    if (newItem.type === 'asset') insert.asset_id = newItem.asset_id; else insert.course_id = newItem.course_id;
    const { error } = await supabase.from('learning_plan_items').insert(insert);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    setNewItem({ type: 'asset', asset_id: '', course_id: '' });
    loadItems(selectedPlan.id);
  };

  const moveItem = async (id: string, dir: number) => {
    if (!selectedPlan) return;
    const index = items.findIndex(i => i.id === id);
    if (index < 0) return;
    const targetIndex = index + dir;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    // swap positions
    const a = items[index];
    const b = items[targetIndex];
    await Promise.all([
      supabase.from('learning_plan_items').update({ position: b.position }).eq('id', a.id),
      supabase.from('learning_plan_items').update({ position: a.position }).eq('id', b.id)
    ]);
    loadItems(selectedPlan.id);
  };

  const deleteItem = async (id: string) => {
    await supabase.from('learning_plan_items').delete().eq('id', id);
    if (selectedPlan) loadItems(selectedPlan.id);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold">Learning Plans</h3>
        <div className="flex gap-4">
          <div className="flex gap-2">
            <Input placeholder="Plan name" value={newPlan.name} onChange={e => setNewPlan(p => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Description" value={newPlan.description} onChange={e => setNewPlan(p => ({ ...p, description: e.target.value }))} />
            <Button size="sm" onClick={createPlan}><Plus className="h-4 w-4 mr-1" />Create</Button>
          </div>
        </div>
      </div>

      <ModernCard variant="glass">
        <ModernCardHeader>
          <ModernCardTitle>Plans</ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {plans.map(p => (
              <Button key={p.id} size="sm" variant={selectedPlan?.id === p.id ? 'default' : 'outline'} onClick={() => setSelectedPlan(p)}>{p.name}</Button>
            ))}
            {plans.length === 0 && <p className="text-sm text-muted-foreground">No plans yet.</p>}
          </div>
        </ModernCardContent>
      </ModernCard>

      {selectedPlan && (
        <ModernCard variant="glass">
          <ModernCardHeader>
            <ModernCardTitle>{selectedPlan.name} Items</ModernCardTitle>
          </ModernCardHeader>
          <ModernCardContent className="space-y-4">
            <div className="flex gap-2 items-end flex-wrap">
              <Select value={newItem.type} onValueChange={v => setNewItem(i => ({ ...i, type: v }))}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                </SelectContent>
              </Select>
              {newItem.type === 'asset' && (
                <Select value={newItem.asset_id} onValueChange={v => setNewItem(i => ({ ...i, asset_id: v }))}>
                  <SelectTrigger className="w-60"><SelectValue placeholder="Asset" /></SelectTrigger>
                  <SelectContent>
                    {assets.map(a => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {newItem.type === 'course' && (
                <Select value={newItem.course_id} onValueChange={v => setNewItem(i => ({ ...i, course_id: v }))}>
                  <SelectTrigger className="w-60"><SelectValue placeholder="Course" /></SelectTrigger>
                  <SelectContent>
                    {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Button size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1" />Add</Button>
            </div>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={it.id} className="flex items-center gap-3 p-3 border rounded-lg bg-background/40 group">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium flex-1 truncate">{it.item_type === 'asset' ? assets.find(a => a.id === it.asset_id)?.title : courses.find(c => c.id === it.course_id)?.title}</p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button disabled={idx===0} onClick={()=> moveItem(it.id,-1)} className="h-7 w-7 inline-flex items-center justify-center rounded border disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
                    <button disabled={idx===items.length-1} onClick={()=> moveItem(it.id,1)} className="h-7 w-7 inline-flex items-center justify-center rounded border disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
                    <button onClick={()=> deleteItem(it.id)} className="h-7 w-7 inline-flex items-center justify-center rounded border text-red-600"><Trash2 className="h-3 w-3" /></button>
                  </div>
                  <span className="text-xs text-muted-foreground uppercase w-14 text-right">{it.item_type}</span>
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-muted-foreground">No items yet.</p>}
            </div>
          </ModernCardContent>
        </ModernCard>
      )}
    </div>
  );
};
