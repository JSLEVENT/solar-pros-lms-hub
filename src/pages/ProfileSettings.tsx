import { useState, useEffect } from 'react';
import { LMSLayout } from '@/components/LMSLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from '@/components/ui/modern-card';

export default function ProfileSettings() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    display_name: '',
    job_title: '',
    time_zone: '',
    locale: '',
    bio: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        display_name: profile.display_name || '',
        job_title: profile.job_title || '',
        time_zone: profile.time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: profile.locale || navigator.language,
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name,
          display_name: form.display_name || null,
          job_title: form.job_title || null,
          time_zone: form.time_zone || null,
          locale: form.locale || null,
          bio: form.bio || null,
          avatar_url: form.avatar_url || null
        })
        .eq('user_id', user.id);
      if (error) throw error;
      toast({ title: 'Saved', description: 'Profile updated' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <LMSLayout>
      <div className="space-y-8">
        <ModernCard variant="glass">
          <ModernCardHeader>
            <ModernCardTitle>Profile Settings</ModernCardTitle>
          </ModernCardHeader>
          <ModernCardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <Input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Preferred short name" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Title</label>
                <Input value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} placeholder="e.g. Sales Manager" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Zone</label>
                <Input value={form.time_zone} onChange={e => setForm(f => ({ ...f, time_zone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Locale</label>
                <Input value={form.locale} onChange={e => setForm(f => ({ ...f, locale: e.target.value }))} placeholder="en-US" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Avatar URL</label>
                <Input value={form.avatar_url} onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={4} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </ModernCardContent>
        </ModernCard>
      </div>
    </LMSLayout>
  );
}
