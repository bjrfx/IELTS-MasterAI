import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { TestProvider } from "@/contexts/TestContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Admin from "@/pages/Admin";
import Practice from "@/pages/Practice";
import Simulation from "@/pages/Simulation";
import Results from "@/pages/Results";
import Test from "@/pages/Test";
import TestResult from "@/pages/TestResult";
import Profile from "@/pages/Profile";
import AIChatPage from "@/pages/AIChat";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import IELTSAcademic from "@/pages/ai-chat/academic";
import IELTSGeneral from "@/pages/ai-chat/general";
function Router() {
  const [location, navigate] = useLocation();
  const { currentUser } = useAuth();
  
  useEffect(() => {
    if (location === '/' && !currentUser) {
      navigate('/login');
    }
  }, [location, currentUser]);
  
  // Determine if the current route should have the sidebar layout
  // Test pages and login don't use the sidebar layout
  const isTestPage = location.startsWith('/test/');
  const isLoginPage = location === '/login';
  const isFullscreenPage = isTestPage || isLoginPage;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/login" component={Login} />
          <Route path="/admin" component={Admin} />
          <Route path="/ai-chat" component={AIChatPage} />
          <Route path="/profile" component={Profile} />
          <Route path="/practice" component={Practice} />
          <Route path="/practice/:module" component={Practice} />
          <Route path="/simulation" component={Simulation} />
          <Route path="/simulation/:type" component={Simulation} />
          <Route path="/results" component={Results} />
          <Route path="/results/:id" component={TestResult} />
          <Route path="/test/:id" component={Test} />
          <Route path="/ai-chat/academic" component={IELTSAcademic} />
          <Route path="/ai-chat/general" component={IELTSGeneral} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/serviceWorker.js').then(
          (registration) => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          },
          (err) => {
            console.log('ServiceWorker registration failed: ', err);
          }
        );
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TestProvider>
          <ThemeProvider>
            <Router />
            <Toaster />
          </ThemeProvider>
        </TestProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
