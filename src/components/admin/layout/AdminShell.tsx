import { ReactNode, useEffect, useState } from 'react';
import { SidebarNav } from './SidebarNav';
import { TopBar } from './TopBar';
import { checkAdminSchema } from '@/lib/admin/schemaGuard';

export function AdminShell({ children }: { children: ReactNode }) {
  const [schemaIssues, setSchemaIssues] = useState<string[]|null>(null);
  useEffect(()=>{(async()=>{ const issues = await checkAdminSchema(); if (issues.length) setSchemaIssues(issues); })();},[]);
  return (
    <div className="flex h-[100dvh] bg-background text-foreground">
      <SidebarNav />
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {schemaIssues && (
            <div className="p-4 border border-amber-400 bg-amber-50 rounded-lg text-sm space-y-1">
              <p className="font-medium text-amber-800">Schema Issues Detected</p>
              <ul className="list-disc ml-5 space-y-0.5 text-amber-700">
                {schemaIssues.map(i=> <li key={i}>{i}</li>)}
              </ul>
              <p className="text-xs text-amber-600">Apply pending migrations to resolve these warnings.</p>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
