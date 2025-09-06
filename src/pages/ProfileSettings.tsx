import { useState, useEffect } from 'react';
import { LMSLayout } from '@/components/LMSLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AvatarUploader } from '@/components/AvatarUploader';
import { useToast } from '@/hooks/use-toast';
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from '@/components/ui/modern-card';

export default function ProfileSettings() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    display_name: '',
    job_title: '',
    time_zone: '',
    locale: '',
    mobile_number: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (profile) {
      const parts = (profile.full_name || '').trim().split(' ');
      const first_name = parts.slice(0, -1).join(' ') || parts[0] || '';
      const last_name = parts.length > 1 ? parts[parts.length - 1] : '';
      setForm({
        first_name,
        last_name,
        display_name: profile.display_name || first_name || '',
        job_title: profile.job_title || '',
        time_zone: profile.time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: profile.locale || navigator.language,
        mobile_number: (profile as any).mobile_number || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const full_name = `${form.first_name} ${form.last_name}`.trim();
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name,
          display_name: form.display_name || full_name || null,
          job_title: form.job_title || null,
            time_zone: form.time_zone || null,
          locale: form.locale || null,
          mobile_number: form.mobile_number || null,
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
                <label className="text-sm font-medium">First Name</label>
                <Input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Mobile Number</label>
                <Input value={form.mobile_number} onChange={e => setForm(f => ({ ...f, mobile_number: e.target.value }))} placeholder="+1 555 123 4567" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Avatar</label>
                <AvatarUploader profileId={profile.user_id} currentUrl={form.avatar_url || profile.avatar_url} onChange={(url) => setForm(f => ({ ...f, avatar_url: url }))} />
              </div>
              {/* Removed Bio field */}
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
