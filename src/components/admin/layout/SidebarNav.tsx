import { NavLink } from 'react-router-dom';
import { BarChart3, Users, Layers, BookOpen, FileText, Settings, LineChart, Building2 } from 'lucide-react';

const links = [
  { to: '/admin/overview', label: 'Overview', icon: BarChart3 },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/teams', label: 'Team Management', icon: Layers },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/repository', label: 'Repository', icon: FileText },
  { to: '/admin/plans', label: 'Plans', icon: Settings },
  { to: '/admin/analytics', label: 'Analytics', icon: LineChart },
  { to: '/admin/org', label: 'Organization', icon: Building2 },
];

export function SidebarNav() {
  return (
    <aside className="w-60 border-r bg-muted/30 backdrop-blur flex flex-col">
      <div className="h-14 flex items-center px-4 font-semibold tracking-wide">LMS Admin</div>
      <nav className="flex-1 overflow-y-auto px-2 space-y-1">
        {links.map(l => {
          const Icon = l.icon;
          return (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent ${isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
            >
              <Icon className="h-4 w-4" />
              {l.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 text-xs text-muted-foreground">© {new Date().getFullYear()}</div>
    </aside>
  );
}
