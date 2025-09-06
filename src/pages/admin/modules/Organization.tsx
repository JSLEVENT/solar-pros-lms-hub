import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Org { id: string; name: string; domain: string | null; branding: any | null; settings: any | null; }

export function AdminOrg(){
  const { toast } = useToast();
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:'', domain:'', logo_url:'', accent_color:'#2563eb', support_email:'', description:'' });

  useEffect(()=> { loadOrg(); }, []);

  const loadOrg = async () => {
    setLoading(true);
    // naive: pick first organization for now (multi-org later)
  const { data, error } = await supabase.from('organizations').select('*').limit(1).maybeSingle();
    if (!error && data) {
      setOrg(data as any);
      const branding = (data as any).branding || {};
      const settings = (data as any).settings || {};
      setForm(f=> ({
        ...f,
        name: data.name || '',
  domain: (data as any).domain || '',
        logo_url: branding.logo_url || '',
        accent_color: branding.accent_color || f.accent_color,
        support_email: settings.support_email || '',
        description: branding.description || ''
      }));
    }
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (!org) {
        const { data, error } = await supabase.from('organizations').insert({
          name: form.name,
          domain: form.domain || null,
          branding: { logo_url: form.logo_url || null, accent_color: form.accent_color, description: form.description },
          settings: { support_email: form.support_email || null }
        }).select('*').single();
        if (error) throw error;
        setOrg(data as any);
      } else {
        const { error } = await supabase.from('organizations').update({
          name: form.name,
          domain: form.domain || null,
          branding: { logo_url: form.logo_url || null, accent_color: form.accent_color, description: form.description },
          settings: { support_email: form.support_email || null }
        }).eq('id', org.id);
        if (error) throw error;
      }
      toast({ title: 'Saved' });
    } catch (e:any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">Organization Settings</h1>
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && (
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-medium">General</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide">Name</label>
                <Input value={form.name} onChange={e=> setForm(f=> ({...f,name:e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide">Domain</label>
                <Input value={form.domain} onChange={e=> setForm(f=> ({...f,domain:e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide">Support Email</label>
                <Input value={form.support_email} onChange={e=> setForm(f=> ({...f,support_email:e.target.value}))} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium">Branding</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide">Logo URL</label>
                <Input value={form.logo_url} onChange={e=> setForm(f=> ({...f,logo_url:e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide">Accent Color</label>
                <Input type="color" value={form.accent_color} onChange={e=> setForm(f=> ({...f,accent_color:e.target.value}))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide">Description</label>
              <Textarea value={form.description} onChange={e=> setForm(f=> ({...f,description:e.target.value}))} />
            </div>
          </section>

          <div className="flex gap-3">
            <Button onClick={save} disabled={saving || !form.name}>{saving? 'Saving…':'Save Settings'}</Button>
            <Button variant="outline" onClick={()=> loadOrg()} disabled={saving}>Reset</Button>
          </div>
          <p className="text-xs text-muted-foreground">Future: custom domains verification, email sender identities, default enrollment policies.</p>
        </div>
      )}
    </div>
  );
}

