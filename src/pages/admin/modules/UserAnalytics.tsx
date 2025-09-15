import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchUserAnalyticsOverview, fetchUserEnrollments, fetchUserCertificates } from '@/lib/admin/queries';

export function AdminUserAnalytics(){
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  useEffect(()=>{(async()=>{
    if(!userId) return;
    setLoading(true);
    try {
      const [o, e, c] = await Promise.all([
        fetchUserAnalyticsOverview(userId),
        fetchUserEnrollments(userId),
        fetchUserCertificates(userId)
      ]);
      setOverview(o); setEnrollments(e); setCerts(c);
    } finally { setLoading(false); }
  })();},[userId]);
  if (!userId) return <div className="p-4">Missing user id</div>;
  if (loading) return <div className="p-4">Loading…</div>;
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-semibold">User Analytics</h1>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="p-4 border rounded-xl">
          <p className="font-medium">Profile</p>
          <p className="text-sm text-muted-foreground">{overview?.profile?.full_name || `${overview?.profile?.first_name || ''} ${overview?.profile?.last_name||''}`}</p>
          <p className="text-xs">Role: {overview?.profile?.role}</p>
          <p className="text-xs">Last active: {overview?.profile?.last_active_at || '—'}</p>
        </div>
        <div className="p-4 border rounded-xl">
          <p className="font-medium">Learning</p>
          <p className="text-sm">Enrollments: {overview?.totals?.enrollments}</p>
          <p className="text-sm">Completed: {overview?.totals?.completed}</p>
          <p className="text-sm">Avg progress: {overview?.totals?.avgProgress}%</p>
        </div>
        <div className="p-4 border rounded-xl">
          <p className="font-medium">Certificates</p>
          <p className="text-sm">Issued: {overview?.certificates}</p>
        </div>
      </div>
      <div className="p-4 border rounded-xl">
        <p className="font-medium mb-2">Recent Enrollments</p>
        <div className="space-y-2 text-sm">
          {enrollments.map((e:any,i)=> (
            <div key={i} className="flex justify-between border-b py-1">
              <span>Course: {e.course_id}</span>
              <span>{e.status} · {e.progress}%</span>
            </div>
          ))}
          {!enrollments.length && <p className="text-muted-foreground">No enrollments</p>}
        </div>
      </div>
      <div className="p-4 border rounded-xl">
        <p className="font-medium mb-2">Certificates</p>
        <div className="space-y-2 text-sm">
          {certs.map((c:any)=> (
            <div key={c.id} className="flex justify-between border-b py-1">
              <span>Assessment: {c.assessment_id}</span>
              <span>Issued: {c.issued_at}</span>
            </div>
          ))}
          {!certs.length && <p className="text-muted-foreground">No certificates</p>}
        </div>
      </div>
    </div>
  );
}
