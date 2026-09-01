import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { type ReactNode, lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AICopilot } from "@/components/AICopilot";
import { ErrorBoundary } from "./components/ErrorBoundary";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Decide = lazy(() => import("./pages/Decide"));
const FastTrack = lazy(() => import("./pages/FastTrack"));
const Plan = lazy(() => import("./pages/Plan"));
const Implement = lazy(() => import("./pages/Implement"));
const Monitor = lazy(() => import("./pages/Monitor"));
const Sustain = lazy(() => import("./pages/Sustain"));
const Team = lazy(() => import("./pages/Team"));
const Learning = lazy(() => import("./pages/Learning"));
const Settings = lazy(() => import("./pages/Settings"));
const SharedView = lazy(() => import("./pages/SharedView"));
const PublicPulse = lazy(() => import("./pages/PublicPulse"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

// One display error in a page degrades to a card inside the nav instead of
// blanking the whole app; navigating to another route clears it automatically.
function PageBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <ErrorBoundary variant="page" resetKeys={[location.pathname]}>
      {children}
    </ErrorBoundary>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/share/:token" element={<SharedView />} />
              <Route path="/p/:token" element={<PublicPulse />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PageBoundary>
                      <Suspense fallback={<RouteFallback />}>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/decide" element={<Decide />} />
                        <Route path="/fast-track" element={<FastTrack />} />
                        <Route path="/plan" element={<Plan />} />
                        <Route path="/implement" element={<Implement />} />
                        <Route path="/monitor" element={<Monitor />} />
                        <Route path="/team" element={<Team />} />
                        <Route path="/learning" element={<Learning />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/sustain" element={<Sustain />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                      </Suspense>
                      </PageBoundary>
                    </Layout>
                    <AICopilot />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
