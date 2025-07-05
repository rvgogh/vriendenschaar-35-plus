
import MatchList from "@/components/MatchList";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TrainingList from "@/components/TrainingList";
import EventList from "@/components/EventList";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const fetchNextActivity = async () => {
  const now = new Date().toISOString();
  
  // Fetch next match
  const { data: nextMatch } = await supabase
    .from("matches")
    .select("id, match_date")
    .not("match_date", "is", null)
    .gte("match_date", now)
    .order("match_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Fetch next training
  const { data: nextTraining } = await supabase
    .from("trainings")
    .select("id, training_at")
    .gte("training_at", now)
    .order("training_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Fetch next event
  const { data: nextEvent } = await supabase
    .from("events")
    .select("id, event_date")
    .not("event_date", "is", null)
    .gte("event_date", now)
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Determine which is next
  const activities = [];
  if (nextMatch) activities.push({ type: 'matches', date: new Date(nextMatch.match_date), id: nextMatch.id });
  if (nextTraining) activities.push({ type: 'trainings', date: new Date(nextTraining.training_at), id: nextTraining.id });
  if (nextEvent) activities.push({ type: 'events', date: new Date(nextEvent.event_date), id: nextEvent.id });

  if (activities.length === 0) {
    return { type: 'trainings', id: null };
  }

  // Sort by date and return the earliest
  activities.sort((a, b) => a.date.getTime() - b.date.getTime());
  return { type: activities[0].type, id: activities[0].id };
};

const Index = () => {
  const { data: nextActivity } = useQuery({
    queryKey: ["nextActivity"],
    queryFn: fetchNextActivity,
  });

  const defaultTab = nextActivity?.type || 'trainings';
  const nextActivityId = nextActivity?.id;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header>
        <div className="bg-card border-b">
          <div className="max-w-[800px] mx-auto">
            <div
              className="h-40 sm:h-56 bg-cover"
              style={{
                backgroundImage: `url('/lovable-uploads/2c6b32eb-0f33-43a7-8a95-d6b6d9f2f175.png')`,
                backgroundPosition: "center center",
              }}
            />
            <div className="px-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="h-20 w-20 bg-white/95 rounded-lg p-1 flex items-center justify-center shadow-md flex-shrink-0">
                    <img
                      src="/lovable-uploads/59cda614-0c72-4bed-b791-eacb6fd4a572.png"
                      alt="Club Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex-grow">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                      Vriendenschaar 35+
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
                      Selecteer hieronder wat je wilt bekijken
                    </p>
                  </div>
                </div>
                <div className="w-full flex justify-end sm:w-auto">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-[800px]">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="matches">Wedstrijden</TabsTrigger>
            <TabsTrigger value="trainings">Trainingen</TabsTrigger>
            <TabsTrigger value="events">Evenementen</TabsTrigger>
          </TabsList>
          <TabsContent value="matches" className="mt-6">
            <MatchList />
          </TabsContent>
          <TabsContent value="trainings" className="mt-6">
            <TrainingList nextActivityId={nextActivityId} />
          </TabsContent>
          <TabsContent value="events" className="mt-6">
            <EventList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
