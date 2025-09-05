import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import MyCourses from "./pages/MyCourses";
import CourseCatalog from "./pages/CourseCatalog";
import Assessments from "./pages/Assessments";
import MyProgress from "./pages/MyProgress";
import Certificates from "./pages/Certificates";
import Discussions from "./pages/Discussions";
import Calendar from "./pages/Calendar";
import VirtualClasses from "./pages/VirtualClasses";
import AdminDashboard from "./pages/AdminDashboard";
import PaymentSuccess from "./pages/PaymentSuccess";
import Notifications from "./pages/Notifications";

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
              path="/courses" 
              element={
                <ProtectedRoute>
                  <MyCourses />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/catalog" 
              element={
                <ProtectedRoute>
                  <CourseCatalog />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/assessments" 
              element={
                <ProtectedRoute>
                  <Assessments />
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
              path="/certificates" 
              element={
                <ProtectedRoute>
                  <Certificates />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/discussions" 
              element={
                <ProtectedRoute>
                  <Discussions />
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
              path="/virtual-classes" 
              element={
                <ProtectedRoute>
                  <VirtualClasses />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="*" element={<div>Page Not Found</div>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
