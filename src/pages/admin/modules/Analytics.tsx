import { useTeams } from '@/hooks/admin/useTeams';
import { useAnalytics } from '@/hooks/admin/useAnalytics';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#2563eb','#7c3aed','#059669','#dc2626','#f59e0b'];

export function AdminAnalytics(){
  const { analytics } = useTeams();
  const { activeSeries, funnel, distribution, topLearners } = useAnalytics();

  return (
    <div className="space-y-10 pb-10">
      <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Active Users (30d)</h2>
        <div className="h-60 border rounded-xl p-2 bg-background">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activeSeries.data||[]}> 
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" hide />
              <YAxis width={40} />
              <Tooltip cursor={{ stroke:'#888', strokeDasharray:'3 3' }} />
              <Line type="monotone" dataKey="active" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Enrollment Funnel</h2>
            <div className="h-60 border rounded-xl p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel.data||[]} layout="vertical" margin={{left:0, right:16}}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="stage" width={90} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#7c3aed" radius={[0,6,6,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Progress Distribution</h2>
          <div className="h-60 border rounded-xl p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution.data||[]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#059669" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Top Learners</h2>
          <div className="h-60 border rounded-xl p-4 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="text-left font-medium pb-2">User</th>
                  <th className="text-right font-medium pb-2">Avg %</th>
                  <th className="text-right font-medium pb-2">Completed</th>
                </tr>
              </thead>
              <tbody>
                {(topLearners.data||[]).map(l=> (
                  <tr key={l.user_id} className="border-t last:border-b">
                    <td className="py-1.5 pr-2">{l.user_id.slice(0,8)}…</td>
                    <td className="py-1.5 text-right">{l.avg_progress.toFixed(0)}%</td>
                    <td className="py-1.5 text-right">{l.completed}</td>
                  </tr>
                ))}
                {(!topLearners.data|| topLearners.data.length===0) && !topLearners.isLoading && (
                  <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-3">
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
      </section>
    </div>
  );
}

