import { supabase } from '@/integrations/supabase/client';
/*
  Assessments Helper Layer
  ---------------------------------
  These utilities wrap newly introduced tables (assessments, assessment_questions, assessment_question_options,
  assessment_attempts, certificates) that may not yet exist in the currently generated Supabase TypeScript types.
  To avoid blocking the build before types are regenerated ("supabase gen types ..."), we deliberately loosen
  typing via `any` casts. Once types include the new tables, these casts can be removed and replaced with the
  generated definitions.
*/

// Centralized loose query helper to bypass missing type errors for new tables
function from(table: string){
  return (supabase as any).from(table);
}

// Guard existence (best-effort). If a table truly doesn't exist yet, calls resolve gracefully.
async function tableExists(name: string){
  try {
    const { error } = await from(name).select('id').limit(1);
    if (error && (error as any).code === '42P01') return false; // undefined table
    return true;
  } catch { return false; }
}

export async function listAssessmentsForCourse(courseId: string){
  if(!await tableExists('assessments')) return [] as any[];
  const { data, error } = await from('assessments')
    .select('id,title,description,assessment_type,total_points,passing_score,time_limit_minutes,attempts_allowed,updated_at')
    .eq('course_id', courseId)
    .order('updated_at', { ascending:false });
  if (error) throw error; return (data || []) as any[];
}

export async function getAssessment(assessmentId: string){
  if(!await tableExists('assessments')) return null;
  const { data, error } = await from('assessments')
    .select('id,course_id,title,description,assessment_type,total_points,passing_score,time_limit_minutes,attempts_allowed,created_at,updated_at')
    .eq('id', assessmentId)
    .single();
  if (error) return null; return data as any;
}

export async function getAssessmentWithQuestions(assessmentId: string){
  if(!await tableExists('assessment_questions')) return null;
  const [questionsRes, optionsRes] = await Promise.all([
    from('assessment_questions').select('id,question_text,question_type,position,points,metadata,assessment_id').eq('assessment_id', assessmentId).order('position'),
    from('assessment_question_options').select('id,question_id,option_text,is_correct,position').order('position')
  ]);
  if (questionsRes.error) throw questionsRes.error;
  if (optionsRes.error) throw optionsRes.error;
  const qData = (questionsRes.data || []) as any[];
  const oData = (optionsRes.data || []) as any[];
  return qData.map((q: any) => ({
    id: q.id,
    question_text: q.question_text,
    question_type: q.question_type,
    position: q.position,
    points: q.points,
    metadata: q.metadata,
    options: oData.filter(o=> o.question_id === q.id).map(o=> ({ id:o.id, option_text:o.option_text }))
  }));
}

export interface StartAttemptOptions { assessmentId: string; }

export async function startAttempt({ assessmentId }: StartAttemptOptions){
  if(!await tableExists('assessment_attempts')) throw new Error('Assessment attempts table missing');
  // Server RLS ensures user can only insert own attempt; we still need user id client-side to embed.
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id; if(!userId) throw new Error('Not authenticated');

  // Validate attempts_allowed if set
  const { data: assessment, error: assessErr } = await from('assessments').select('id,attempts_allowed').eq('id', assessmentId).single();
  if (assessErr || !assessment) throw assessErr || new Error('Assessment not found');
  if (assessment.attempts_allowed){
  const { count, error: countErr } = await from('assessment_attempts').select('*', { count:'exact', head: true }).eq('assessment_id', assessmentId).eq('user_id', userId);
    if (countErr) throw countErr;
    if ((count||0) >= assessment.attempts_allowed) throw new Error('No attempts remaining');
  }

  const { data, error } = await from('assessment_attempts').insert({ assessment_id: assessmentId, user_id: userId }).select('*').single();
  if (error) throw error; return data;
}

export interface SubmitAttemptPayload { attemptId: string; responses: Record<string,string>; }

export async function submitAttempt({ attemptId, responses }: SubmitAttemptPayload){
  if(!await tableExists('assessment_attempts')) throw new Error('Assessment attempts table missing');
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id; if(!userId) throw new Error('Not authenticated');

  // Mark submitted; trigger will compute score & potentially issue certificate.
  const { data, error } = await from('assessment_attempts')
    .update({ responses, submitted_at: new Date().toISOString(), duration_seconds: 0 })
    .eq('id', attemptId)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data; // After update triggers, includes score/passed
}

export async function listAttempts(assessmentId: string){
  if(!await tableExists('assessment_attempts')) return [];
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id; if(!userId) return [];
  const { data, error } = await from('assessment_attempts')
    .select('id,started_at,submitted_at,score,passed')
    .eq('assessment_id', assessmentId)
    .eq('user_id', userId)
    .order('started_at', { ascending:false });
  if (error) throw error; return data||[];
}

export async function listCertificates(){
  if(!await tableExists('certificates')) return [];
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id; if(!userId) return [];
  const { data, error } = await from('certificates')
    .select('id,course_id,assessment_id,issued_at,certificate_code')
    .eq('user_id', userId)
    .order('issued_at', { ascending:false });
  if (error) throw error; return data||[];
}

export async function generateCertificateDownloadURL(certificateCode: string){
  // Placeholder: could call a storage edge function to render PDF.
  return `/api/certificates/${certificateCode}`;
}
