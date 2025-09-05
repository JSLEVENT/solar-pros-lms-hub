import { useTeams } from '@/hooks/admin/useTeams';
export function AdminAnalytics(){
  const { analytics } = useTeams();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Team Performance</h2>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {(analytics.data||[]).map((a:any)=> (
            <div key={a.team_id} className="p-4 border rounded-xl text-sm flex justify-between">
              <div>
                <p className="font-medium">{a.team_name}</p>
                <p className="text-xs text-muted-foreground">{a.member_count||0} members</p>
              </div>
              <div className="text-right text-xs">
                <p>{(a.avg_progress||0).toFixed(0)}% avg</p>
                <p className="text-muted-foreground">{a.completed_courses||0} done</p>
              </div>
            </div>
          ))}
          {(analytics.data||[]).length===0 && !analytics.isLoading && <p className="text-sm text-muted-foreground">No analytics yet.</p>}
        </div>
      </div>
    </div>
  );
}

