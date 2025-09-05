import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import MyTraining from "./pages/MyTraining";
import AITrainingArena from "./pages/AITrainingArena";
import MyProgress from "./pages/MyProgress";
import Calendar from "./pages/Calendar";
import LiveTrainings from "./pages/LiveTrainings";
import AdminDashboard from "./pages/AdminDashboard";
import { LMSLayout } from "./components/LMSLayout";
import ProfileSettings from './pages/ProfileSettings';
import { TeamManagement } from "./components/TeamManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-training" 
              element={
                <ProtectedRoute>
                  <MyTraining />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ai-training-arena" 
              element={
                <ProtectedRoute>
                  <AITrainingArena />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/progress" 
              element={
                <ProtectedRoute>
                  <MyProgress />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/calendar" 
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/live-trainings" 
              element={
                <ProtectedRoute>
                  <LiveTrainings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole={["admin", "owner"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/settings/profile"
              element={
                <ProtectedRoute>
                  <ProfileSettings />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/teams" 
              element={
                <ProtectedRoute requiredRole={["manager", "admin", "owner"]}>
                  <LMSLayout>
                    <TeamManagement />
                  </LMSLayout>
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<div>Page Not Found</div>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;