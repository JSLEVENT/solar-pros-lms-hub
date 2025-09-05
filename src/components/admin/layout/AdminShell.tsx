import { ReactNode } from 'react';
import { SidebarNav } from './SidebarNav';
import { TopBar } from './TopBar';

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[100dvh] bg-background text-foreground">
      <SidebarNav />
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}
