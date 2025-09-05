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
  const userRole = profile?.role || 'learner';
  const currentPath = window.location.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <LMSHeader />
      
      <div className="flex">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={cn(
          "fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] w-64 transform border-r bg-card/50 backdrop-blur transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="h-full overflow-y-auto">
            <LMSNavigation 
              userRole={userRole} 
              currentPath={currentPath}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="fixed top-20 left-4 z-40"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          {/* Content Area */}
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}