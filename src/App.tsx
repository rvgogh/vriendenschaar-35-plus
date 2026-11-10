
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import MyTrainingPage from "./pages/MyTrainingPage";
import MyMatchesPage from "./pages/MyMatchesPage";
import MyEventsPage from "./pages/MyEventsPage";
import AuthPage from "./pages/AuthPage";
import AdminPage from "./pages/AdminPage";
import AdminStatisticsPage from "./pages/AdminStatisticsPage";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/components/ThemeProvider";
import LoginButton from "@/components/LoginButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import BarDutiesPage from "./pages/BarDutiesPage";
import BarDutiesPublicPage from "./pages/BarDutiesPublicPage";
import TrainingPlansPage from "./pages/TrainingPlansPage";
import TrainingPlanPage from "./pages/TrainingPlanPage";
import TrainingTeamsPage from "./pages/TrainingTeamsPage";
import TrainingProgramPage from "./pages/TrainingProgramPage";
import TrainingPrintPage from "./pages/TrainingPrintPage";
import DrillsPage from "./pages/DrillsPage";
import DrillPage from "./pages/DrillPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <NotificationPrompt />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              {/* Printweergave: buiten de app-layout, zodat alleen het A4 op papier komt */}
              <Route path="/training/:trainingId/print" element={<ProtectedRoute><TrainingPrintPage /></ProtectedRoute>} />
              <Route path="/*" element={
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <main className="flex-1">
                      <header className="h-16 flex items-center justify-between border-b px-4">
                        <div className="flex items-center gap-2">
                          <SidebarTrigger />
                        </div>
                        <div className="flex items-center gap-2">
                          <LoginButton />
                          <ThemeToggle />
                        </div>
                      </header>
                      <Routes>
<Route path="/bar-duties" element={<ProtectedRoute><BarDutiesPage /></ProtectedRoute>} />
                        <Route path="/bardiensten" element={<ProtectedRoute><BarDutiesPublicPage /></ProtectedRoute>} />
                        <Route path="/training-plans" element={<ProtectedRoute><TrainingPlansPage /></ProtectedRoute>} />
                        <Route path="/training-plans/:trainingId" element={<ProtectedRoute><TrainingPlanPage /></ProtectedRoute>} />
                        <Route path="/training-plans/:trainingId/teams" element={<ProtectedRoute><TrainingTeamsPage /></ProtectedRoute>} />
                        <Route path="/training/:trainingId" element={<ProtectedRoute><TrainingProgramPage /></ProtectedRoute>} />
                        <Route path="/drills" element={<ProtectedRoute><DrillsPage /></ProtectedRoute>} />
                        <Route path="/drills/:drillId" element={<ProtectedRoute><DrillPage /></ProtectedRoute>} />
                        <Route path="/" element={
                          <ProtectedRoute>
                            <Index />
                          </ProtectedRoute>
                        } />
                        <Route path="/admin" element={
                          <ProtectedRoute>
                            <AdminPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/admin/statistics" element={
                          <ProtectedRoute>
                            <AdminStatisticsPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/my-training" element={
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
