import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Strongly typed profile structure
export interface Profile {
  user_id: string;
  full_name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  // The following fields may not exist yet in the current DB row; mark optional
  job_title?: string | null;
  avatar_url: string | null;
  role: string;
  time_zone?: string | null;
  preferences?: any;
  mobile_number?: string | null;
  last_active_at?: string | null;
  first_login_at?: string | null;
  last_login_at?: string | null;
  login_count?: number;
  total_learning_seconds?: number;
  created_at: string;
  updated_at: string;
  organization_id?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  let profileFetchLogged = false;
  const fetchProfile = async (userId: string) => {
    try {
  const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Gracefully handle common bootstrap issues (400 when RLS blocks or no row yet)
        if (!profileFetchLogged) {
          profileFetchLogged = true;
          console.warn('[auth] profile fetch issue', { status, message: error.message, code: (error as any).code });
        }
        return null;
      }
      if (!data) return null;
      // Normalize shape with safe defaults to satisfy UI expectations
      const normalized: Profile = {
        user_id: data.user_id,
        full_name: data.full_name,
        first_name: (data as any).first_name ?? null,
        last_name: (data as any).last_name ?? null,
        avatar_url: data.avatar_url,
        role: data.role as string,
        created_at: data.created_at,
        updated_at: data.updated_at,
        organization_id: (data as any).organization_id ?? null,
        job_title: (data as any).job_title ?? null,
        time_zone: (data as any).time_zone ?? null,
        preferences: (data as any).preferences ?? {},
        last_active_at: (data as any).last_active_at ?? null,
        first_login_at: (data as any).first_login_at ?? null,
        last_login_at: (data as any).last_login_at ?? null,
        login_count: (data as any).login_count ?? 0,
        total_learning_seconds: (data as any).total_learning_seconds ?? 0,
        mobile_number: (data as any).mobile_number ?? null,
      };
      return normalized;
    } catch (error: any) {
      if (!profileFetchLogged) {
        profileFetchLogged = true;
        console.warn('[auth] unexpected profile fetch exception', { message: error?.message });
      }
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetch to avoid blocking auth state
          setTimeout(async () => {
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
          setLoading(false);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    // Track login analytics (best-effort)
    if (!error && data?.session?.user) {
      try {
        await supabase.from('analytics').insert({
          user_id: data.session.user.id,
          event_type: 'user_login',
          reference_type: 'auth'
        });
      } catch (e) {
        console.warn('Failed to log login event', e);
      }
    }
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role: role,
        }
      }
    });
    return { error };
  };

  const signOut = async () => {
    // Optional logout event (doesn't affect profile metrics directly)
    if (user) {
      try { await supabase.from('analytics').insert({ user_id: user.id, event_type: 'user_logout', reference_type: 'auth' }); } catch {}
    }
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};