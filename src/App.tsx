import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AICopilot } from "@/components/AICopilot";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import Decide from "./pages/Decide";
import Plan from "./pages/Plan";
import Implement from "./pages/Implement";
import Monitor from "./pages/Monitor";
import Sustain from "./pages/Sustain";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/decide" element={<Decide />} />
                      <Route path="/plan" element={<Plan />} />
                      <Route path="/implement" element={<Implement />} />
                      <Route path="/monitor" element={<Monitor />} />
                      <Route path="/team" element={<Team />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/sustain" element={<Sustain />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                  <AICopilot />
                </ProtectedRoute>
              }
            />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
