
import MatchList from "@/components/MatchList";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TrainingList from "@/components/TrainingList";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <header
          className="mb-12 rounded-lg p-8 relative overflow-hidden text-white shadow-lg"
          style={{
            backgroundImage: `url('/lovable-uploads/2c6b32eb-0f33-43a7-8a95-d6b6d9f2f175.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/60 z-0" />
          <div className="relative z-10">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-white/95 rounded-lg p-1 flex items-center justify-center shadow-md">
                        <img src="/lovable-uploads/59cda614-0c72-4bed-b791-eacb6fd4a572.png" alt="Club Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                    <h1 className="text-5xl font-extrabold tracking-tight text-shadow">
                        Vriendenschaar 35+
                    </h1>
                </div>
                <ThemeToggle />
            </div>
            <p className="mt-4 text-lg text-center text-white/90">
                Selecteer hieronder wat je wilt bekijken
            </p>
          </div>
        </header>

        <main>
          <Tabs defaultValue="trainings" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="matches">Wedstrijden</TabsTrigger>
              <TabsTrigger value="trainings">Trainingen</TabsTrigger>
            </TabsList>
            <TabsContent value="matches" className="mt-6">
              <MatchList />
            </TabsContent>
            <TabsContent value="trainings" className="mt-6">
              <TrainingList />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Index;
