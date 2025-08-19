
import { useAuth } from "@/hooks/useAuth";
import MatchList from "@/components/MatchList";
import EventList from "@/components/EventList";
import TrainingList from "@/components/TrainingList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Team Overzicht</h1>
          {user ? (
            <p className="text-muted-foreground">Welkom {user.email}</p>
          ) : (
            <p className="text-muted-foreground">Bekijk wedstrijden, evenementen en trainingen</p>
          )}
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

export default Index;
