import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import MatchList from "@/components/MatchList";
import EventList from "@/components/EventList";
import TrainingList from "@/components/TrainingList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigate } from "react-router-dom";

const OldHomepage = () => {
  const { user } = useAuth();
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Laden...</p>
        </div>
      </div>
    );
  }

  if (role !== 'superuser') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Team Overzicht (Admin)</h1>
          <p className="text-muted-foreground">Oude homepage - alleen toegankelijk voor administrators</p>
        </div>

        <Tabs defaultValue="matches" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="matches">Wedstrijden</TabsTrigger>
            <TabsTrigger value="events">Evenementen</TabsTrigger>
            <TabsTrigger value="trainings">Trainingen</TabsTrigger>
          </TabsList>
          
          <TabsContent value="matches" className="mt-6">
            <MatchList />
          </TabsContent>
          
          <TabsContent value="events" className="mt-6">
            <EventList />
          </TabsContent>
          
          <TabsContent value="trainings" className="mt-6">
            <TrainingList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OldHomepage;