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
  const { profile, user, refreshProfile } = useAuth() as any; // assuming hook exposes refreshProfile or similar
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    job_title: '',
    time_zone: '',
    mobile_number: ''
  });
  const [errors, setErrors] = useState<{ first_name?:string; last_name?:string; mobile_number?:string }>({});

  useEffect(() => {
    if (profile) {
      const parts = (profile.full_name || '').trim().split(' ');
      const first_name = parts.slice(0, -1).join(' ') || parts[0] || '';
      const last_name = parts.length > 1 ? parts[parts.length - 1] : '';
      setForm({
        first_name,
        last_name,
        job_title: profile.job_title || '',
        time_zone: profile.time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  mobile_number: (profile as any).mobile_number || ''
      });
    }
  }, [profile]);

  function validate(){
    const next: typeof errors = {};
    if(!form.first_name.trim()) next.first_name = 'First name is required';
    if(!form.last_name.trim()) next.last_name = 'Last name is required';
    if(form.mobile_number.trim()){
      const re = /^\+?[0-9 ()-]{7,20}$/;
      if(!re.test(form.mobile_number.trim())) next.mobile_number = 'Invalid mobile number';
    }
    setErrors(next);
    return Object.keys(next).length===0;
  }

  const save = async () => {
    if (!user) return;
    if(!validate()) { toast({ title:'Validation', description:'Please fix validation errors', variant:'destructive' }); return; }
    setSaving(true);
    try {
      const full_name = `${form.first_name} ${form.last_name}`.trim();
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name,
          job_title: form.job_title || null,
          time_zone: form.time_zone || null,
          mobile_number: form.mobile_number || null
        })
        .eq('user_id', user.id);
      if (error) throw error;
      // Refresh auth profile context if method provided
      if (typeof refreshProfile === 'function') {
        try { await refreshProfile(); } catch {}
      }
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
                <label className="text-sm font-medium">First Name <span className="text-destructive">*</span></label>
                <Input value={form.first_name} onChange={e => { setForm(f => ({ ...f, first_name: e.target.value })); if(errors.first_name) setErrors(er=>({...er,first_name:undefined})); }} />
                {errors.first_name && <p className="text-xs text-destructive">{errors.first_name}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name <span className="text-destructive">*</span></label>
                <Input value={form.last_name} onChange={e => { setForm(f => ({ ...f, last_name: e.target.value })); if(errors.last_name) setErrors(er=>({...er,last_name:undefined})); }} />
                {errors.last_name && <p className="text-xs text-destructive">{errors.last_name}</p>}
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
                <label className="text-sm font-medium">Mobile Number</label>
                <Input value={form.mobile_number} onChange={e => { setForm(f => ({ ...f, mobile_number: e.target.value })); if(errors.mobile_number) setErrors(er=>({...er,mobile_number:undefined})); }} placeholder="+1 555 123 4567" />
                {errors.mobile_number && <p className="text-xs text-destructive">{errors.mobile_number}</p>}
              </div>
              {/* Removed Bio field */}
            </div>
            <div className="flex justify-end">
              <Button onClick={save} disabled={saving} className="min-w-[140px] flex items-center justify-center gap-2">
                {saving && <span className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </ModernCardContent>
        </ModernCard>
      </div>
    </LMSLayout>
  );
}
