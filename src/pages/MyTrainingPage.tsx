import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrainingAttendanceStatus, PlayerWithTrainingStatus, Training } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import LoginButton from "@/components/LoginButton";

const fetchMyPlayer = async (userId: string) => {
  const { data: player, error } = await supabase
    .from("players")
    .select("*")
    .eq("user_id", userId)
    .single();
  
  if (error) throw error;
  return player;
};

const fetchUpcomingTrainings = async () => {
  const { data: trainings, error } = await supabase
    .from("trainings")
    .select("*")
    .gte("training_at", new Date().toISOString())
    .order("training_at", { ascending: true });
  
  if (error) throw error;
  return trainings;
};

const fetchPlayersWithTrainingStatus = async (trainingId: number): Promise<PlayerWithTrainingStatus[]> => {
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("*")
    .order('name', { ascending: true });
  if (playersError) throw playersError;

  const { data: statuses, error: statusesError } = await supabase
    .from("training_statuses")
    .select("*")
    .eq("training_id", trainingId);
  if (statusesError) throw statusesError;

  const statusMap = new Map((statuses || []).map(s => [s.player_id, s.status]));

  return (players || []).map(p => ({
    ...p,
    status: statusMap.get(p.id) || "UNKNOWN",
  }));
};

const TrainingCard = ({ training, myPlayer, onStatusChange }: {
  training: Training;
  myPlayer: any;
  onStatusChange: (trainingId: number, status: TrainingAttendanceStatus) => void;
}) => {
  const { data: players } = useQuery({
    queryKey: ["trainingPlayers", training.id],
    queryFn: () => fetchPlayersWithTrainingStatus(training.id),
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const myStatus = players?.find(p => p.id === myPlayer?.id)?.status || "UNKNOWN";
  const yesCount = players?.filter(p => p.status === 'YES').length || 0;
  const noCount = players?.filter(p => p.status === 'NO').length || 0;
  const unknownCount = players?.filter(p => p.status === 'UNKNOWN').length || 0;

  return (
    <Card className="mb-6 bg-secondary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <div>
            <div className="text-xl">Training</div>
            <div className="text-lg text-muted-foreground font-normal">
              {formatDate(training.training_at)}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Tijd: {formatTime(training.training_at)}</span>
        </div>

        {/* Status Overview */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Aanwezigheidsoverzicht</h4>
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div className="space-y-1">
              <div className="text-xl">🍆</div>
              <div className="font-semibold text-green-600">{yesCount}</div>
              <div className="text-muted-foreground">Aanwezig</div>
            </div>
            <div className="space-y-1">
              <div className="text-xl">❌</div>
              <div className="font-semibold text-red-600">{noCount}</div>
              <div className="text-muted-foreground">Afwezig</div>
            </div>
            <div className="space-y-1">
              <div className="text-xl">❓</div>
              <div className="font-semibold text-gray-600">{unknownCount}</div>
              <div className="text-muted-foreground">Niet gereageerd</div>
            </div>
          </div>
        </div>

        {/* My Status */}
        {myPlayer && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Mijn aanwezigheid</h4>
            <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
              <span className="font-medium">{myPlayer.name}</span>
              <div className="flex gap-2">
                <Button 
                  variant='outline'
                  size="sm" 
                  onClick={() => onStatusChange(training.id, myStatus === 'YES' ? 'UNKNOWN' : 'YES')}
                  className={cn("text-2xl w-12", myStatus === 'YES' && "ring-2 ring-primary")}
                >
                  🍆
                </Button>
                <Button 
                  variant='outline'
                  size="sm" 
                  onClick={() => onStatusChange(training.id, myStatus === 'NO' ? 'UNKNOWN' : 'NO')}
                  className={cn("text-2xl w-12", myStatus === 'NO' && "ring-2 ring-destructive")}
                >
                  ❌
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* All Players List */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Alle spelers</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {players?.map((player) => (
              <div key={player.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                <span>{player.name}</span>
                <span className="text-lg">
                  {player.status === 'YES' ? '🍆' : player.status === 'NO' ? '❌' : '❓'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MyTrainingPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: myPlayer } = useQuery({
    queryKey: ["myPlayer", user?.id],
    queryFn: () => fetchMyPlayer(user!.id),
    enabled: !!user?.id,
  });

  const { data: trainings, isLoading } = useQuery({
    queryKey: ["upcomingTrainings"],
    queryFn: fetchUpcomingTrainings,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ trainingId, status }: { trainingId: number, status: TrainingAttendanceStatus }) => {
      if (!myPlayer) throw new Error("Geen speler gekoppeld aan account");
      
      const { error } = await supabase
        .from("training_statuses")
        .upsert({ training_id: trainingId, player_id: myPlayer.id, status: status });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainingPlayers"] });
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
      toast.success("Aanwezigheid bijgewerkt!");
    },
    onError: (error) => {
      toast.error(`Kon aanwezigheid niet bijwerken: ${error.message}`);
    }
  });

  const handleStatusChange = (trainingId: number, status: TrainingAttendanceStatus) => {
    updateStatusMutation.mutate({ trainingId, status });
  };

  if (!myPlayer) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-[800px]">
        <header className="mb-8 flex justify-between items-start">
          <Button asChild variant="outline">
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Terug
            </Link>
          </Button>
          <LoginButton />
        </header>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Er is geen speler gekoppeld aan jouw account. Neem contact op met de beheerder.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-[800px]">
      <header className="mb-8 flex justify-between items-start">
        <Button asChild variant="outline">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Terug
          </Link>
        </Button>
        <LoginButton />
      </header>

      <main>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Mijn Trainingen</h1>
          <p className="text-muted-foreground">
            Beheer je aanwezigheid voor aankomende trainingen
          </p>
        </div>

        {isLoading ? (
          <div>Trainingen laden...</div>
        ) : trainings && trainings.length > 0 ? (
          <div className="space-y-6">
            {trainings.map((training) => (
              <TrainingCard
                key={training.id}
                training={training}
                myPlayer={myPlayer}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                Er zijn momenteel geen aankomende trainingen.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default MyTrainingPage;