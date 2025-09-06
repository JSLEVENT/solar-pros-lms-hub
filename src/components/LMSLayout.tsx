import { LMSHeader } from "./LMSHeader";
import { LMSNavigation } from "./LMSNavigation";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface LMSLayoutProps {
  children: React.ReactNode;
}

export function LMSLayout({ children }: LMSLayoutProps) {
  const { profile } = useAuth();
  const userRole = (profile?.role as "owner" | "admin" | "manager" | "learner") || 'learner';
  const currentPath = window.location.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-surface">
      <LMSHeader />
      
      <div className="flex">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-energy-black/30 backdrop-blur-sm lg:hidden animate-fade-in" 
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Modern Floating Sidebar */}
        <aside className={cn(
          "fixed top-20 left-4 z-50 h-[calc(100vh-6rem)] w-64 transform card-glass border-white/10 rounded-2xl transition-all duration-300 ease-out lg:translate-x-0 lg:static lg:z-auto lg:top-0 lg:left-0 lg:h-[calc(100vh-4rem)] lg:rounded-none lg:border-r lg:border-l-0 lg:border-t-0 lg:border-b-0",
          sidebarOpen ? "translate-x-0 scale-100 opacity-100" : "-translate-x-full scale-95 opacity-0 lg:scale-100 lg:opacity-100"
        )}>
          <div className="h-full overflow-y-auto p-2">
            <LMSNavigation 
              userRole={userRole} 
              currentPath={currentPath}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          {/* Floating Mobile Menu Button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="fixed top-20 left-4 z-40 card-glass border-white/20 rounded-full w-10 h-10 p-0 backdrop-blur-xl"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          {/* Modern Content Container */}
          <div className="p-6 lg:p-8 lg:pl-6 animate-fade-in">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}