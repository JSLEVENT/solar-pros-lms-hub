import { Plus, BookOpen, Users, Award } from 'lucide-react';

export function AdminPlans(){
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Learning Plans</h1>
        <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
          <Plus className="h-4 w-4" />
          Create Plan
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border bg-card text-card-foreground shadow card-glass">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="font-semibold leading-none tracking-tight text-sm font-medium">Total Plans</h3>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </div>
        </div>
        
        <div className="rounded-xl border bg-card text-card-foreground shadow card-glass">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="font-semibold leading-none tracking-tight text-sm font-medium">Active Learners</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">+15% this week</p>
          </div>
        </div>
        
        <div className="rounded-xl border bg-card text-card-foreground shadow card-glass">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="font-semibold leading-none tracking-tight text-sm font-medium">Completion Rate</h3>
            <Award className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow card-glass">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">Learning Plans Management</h3>
        </div>
        <div className="p-6 pt-0">
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Learning Plans Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Create structured learning paths with courses, assessments, and learning materials. 
              This feature will be available in the next update.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}