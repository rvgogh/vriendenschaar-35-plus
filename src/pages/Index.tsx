
import PlayerList from "@/components/PlayerList";
import UpcomingMatch from "@/components/UpcomingMatch";
import { Trophy } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
            <div className="flex items-center justify-center gap-4">
                <Trophy className="h-12 w-12 text-primary" />
                <h1 className="text-5xl font-extrabold tracking-tight">
                    Soccer Team Planner
                </h1>
            </div>
          <p className="text-muted-foreground mt-2 text-lg">
            Get ready for the next game!
          </p>
        </header>

        <main>
          <UpcomingMatch />
          <PlayerList />
        </main>
      </div>
    </div>
  );
};

export default Index;
