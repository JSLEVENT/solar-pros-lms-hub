import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Suspense, lazy } from 'react';
const Index = lazy(()=> import('./pages/Index'));
const Auth = lazy(()=> import('./pages/Auth'));
const MyTraining = lazy(()=> import('./pages/MyTraining'));
const AITrainingArena = lazy(()=> import('./pages/AITrainingArena'));
const MyProgress = lazy(()=> import('./pages/MyProgress'));
const Calendar = lazy(()=> import('./pages/Calendar'));
const LiveTrainings = lazy(()=> import('./pages/LiveTrainings'));
const AdminIndex = lazy(()=> import('./pages/admin'));
import { LMSLayout } from "./components/LMSLayout";
import ProfileSettings from './pages/ProfileSettings';
import { TeamManagement } from "./components/TeamManagement";
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
            <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading module…</div>}>
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
              path="/admin/*"
              element={
                <ProtectedRoute requiredRole={["admin","owner"]}>
                  <AdminIndex />
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
            </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;