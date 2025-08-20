
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import MatchesPage from "./pages/MatchesPage";
import EventsPage from "./pages/EventsPage";
import TrainingsPage from "./pages/TrainingsPage";
import MatchPage from "./pages/MatchPage";
import EventPage from "./pages/EventPage";
import TrainingPage from "./pages/TrainingPage";
import MyTrainingPage from "./pages/MyTrainingPage";
import MyMatchesPage from "./pages/MyMatchesPage";
import MyEventsPage from "./pages/MyEventsPage";
import AuthPage from "./pages/AuthPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/components/ThemeProvider";
import LoginButton from "@/components/LoginButton";
import { ThemeToggle } from "@/components/ThemeToggle";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/*" element={
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <main className="flex-1">
                      <header className="h-16 flex items-center justify-between border-b px-4">
                        <SidebarTrigger />
                        <div className="flex items-center gap-2">
                          <LoginButton />
                          <ThemeToggle />
                        </div>
                      </header>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/matches" element={<MatchesPage />} />
                        <Route path="/events" element={<EventsPage />} />
                        <Route path="/trainings" element={<TrainingsPage />} />
                        <Route path="/match/:id" element={<MatchPage />} />
                        <Route path="/event/:id" element={<EventPage />} />
                        <Route path="/training/:id" element={<TrainingPage />} />
                        <Route path="/admin" element={
                          <ProtectedRoute>
                            <AdminPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/my-trainings" element={
                          <ProtectedRoute>
                            <MyTrainingPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/my-matches" element={
                          <ProtectedRoute>
                            <MyMatchesPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/my-events" element={
                          <ProtectedRoute>
                            <MyEventsPage />
                          </ProtectedRoute>
                        } />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </SidebarProvider>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
