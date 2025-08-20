import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PlayerStatus, PlayerWithStatus, Match } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, UserCheck } from "lucide-react";
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

const fetchUpcomingMatches = async () => {
  const { data: matches, error } = await supabase
    .from("matches")
    .select("*")
    .gte("match_date", new Date().toISOString().split('T')[0])
    .order("match_date", { ascending: true });
  
  if (error) throw error;
  return matches;
};

const fetchPlayersWithMatchStatus = async (matchId: number): Promise<PlayerWithStatus[]> => {
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("*")
    .order('name', { ascending: true });
  if (playersError) throw playersError;

  const { data: statuses, error: statusesError } = await supabase
    .from("player_statuses")
    .select("*")
    .eq("match_id", matchId);
  if (statusesError) throw statusesError;

  const statusMap = new Map((statuses || []).map(s => [s.player_id, s.status]));

  return (players || []).map(p => ({
    ...p,
    status: statusMap.get(p.id) || "UNKNOWN",
  }));
};

const MatchCard = ({ match, myPlayer, onStatusChange }: {
  match: Match;
  myPlayer: any;
  onStatusChange: (matchId: number, status: PlayerStatus) => void;
}) => {
  const { data: players } = useQuery({
    queryKey: ["matchPlayers", match.id],
    queryFn: () => fetchPlayersWithMatchStatus(match.id),
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = new Intl.DateTimeFormat('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
    
    return dateStr;
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const myStatus = players?.find(p => p.id === myPlayer?.id)?.status || "UNKNOWN";
  const inCount = players?.filter(p => p.status === 'IN').length || 0;
  const outCount = players?.filter(p => p.status === 'OUT').length || 0;
  const maybeCount = players?.filter(p => p.status === 'MAYBE').length || 0;
  const unknownCount = players?.filter(p => p.status === 'UNKNOWN').length || 0;

  // Sort players by status and then alphabetically
  const sortedPlayers = players?.slice().sort((a, b) => {
    const statusOrder = { 'IN': 0, 'MAYBE': 1, 'OUT': 2, 'UNKNOWN': 3 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return a.name.localeCompare(b.name);
  }) || [];

  return (
    <Card className="mb-6 bg-secondary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <div>
            <div className="text-xl">{match.opponent}</div>
            <div className="text-lg text-muted-foreground font-normal">
              {match.match_date ? formatDate(match.match_date) : 'Datum onbekend'}
              {match.start_time && ` om ${formatTime(match.start_time)}`}
            </div>
          </div>
        </CardTitle>
        {match.arrival_time && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserCheck className="h-4 w-4" />
            <span>Aanwezig zijn om: {formatTime(match.arrival_time)}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* My Status */}
        {myPlayer && (
          <div>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Mijn status</h4>
            <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
              <span className="font-medium">{myPlayer.name}</span>
              <div className="flex gap-2">
                <Button 
                  variant='outline'
                  size="sm" 
                  onClick={() => onStatusChange(match.id, myStatus === 'IN' ? 'UNKNOWN' : 'IN')}
                  className={cn("text-2xl w-12", myStatus === 'IN' && "ring-2 ring-primary")}
                >
                  🍆
                </Button>
                <Button 
                  variant='outline'
                  size="sm" 
                  onClick={() => onStatusChange(match.id, myStatus === 'MAYBE' ? 'UNKNOWN' : 'MAYBE')}
                  className={cn("text-2xl w-12", myStatus === 'MAYBE' && "ring-2 ring-orange-500")}
                >
                  ❓
                </Button>
                <Button 
                  variant='outline'
                  size="sm" 
                  onClick={() => onStatusChange(match.id, myStatus === 'OUT' ? 'UNKNOWN' : 'OUT')}
                  className={cn("text-2xl w-12", myStatus === 'OUT' && "ring-2 ring-destructive")}
                >
                  ❌
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Status Overview */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Statusoverzicht</h4>
          <div className="grid grid-cols-4 gap-4 text-center text-sm">
            <div className="space-y-1">
              <div className="text-xl">🍆</div>
              <div className="font-semibold text-green-600">{inCount}</div>
              <div className="text-muted-foreground">Aanwezig</div>
            </div>
            <div className="space-y-1">
              <div className="text-xl">❓</div>
              <div className="font-semibold text-orange-500">{maybeCount}</div>
              <div className="text-muted-foreground">Misschien</div>
            </div>
            <div className="space-y-1">
              <div className="text-xl">❌</div>
              <div className="font-semibold text-red-600">{outCount}</div>
              <div className="text-muted-foreground">Afwezig</div>
            </div>
            <div className="space-y-1">
              <div className="text-xl">➖</div>
              <div className="font-semibold text-gray-600">{unknownCount}</div>
              <div className="text-muted-foreground">Niet gereageerd</div>
            </div>
          </div>
        </div>

        {/* All Players List */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Alle spelers</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {sortedPlayers.map((player) => (
              <div key={player.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                <span>{player.name}</span>
                <span className="text-lg">
                  {player.status === 'IN' ? '🍆' : player.status === 'MAYBE' ? '❓' : player.status === 'OUT' ? '❌' : '➖'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MyMatchesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: myPlayer } = useQuery({
    queryKey: ["myPlayer", user?.id],
    queryFn: () => fetchMyPlayer(user!.id),
    enabled: !!user?.id,
  });

  const { data: matches, isLoading } = useQuery({
    queryKey: ["upcomingMatches"],
    queryFn: fetchUpcomingMatches,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ matchId, status }: { matchId: number, status: PlayerStatus }) => {
      if (!myPlayer) throw new Error("Geen speler gekoppeld aan account");
      
      const { error } = await supabase
        .from("player_statuses")
        .upsert({ match_id: matchId, player_id: myPlayer.id, status: status });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matchPlayers"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      toast.success("Status bijgewerkt!");
    },
    onError: (error) => {
      toast.error(`Kon status niet bijwerken: ${error.message}`);
    }
  });

  const handleStatusChange = (matchId: number, status: PlayerStatus) => {
    updateStatusMutation.mutate({ matchId, status });
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
          <h1 className="text-3xl font-bold text-primary mb-2">Mijn Wedstrijden</h1>
          <p className="text-muted-foreground">
            Beheer je aanwezigheid voor aankomende wedstrijden
          </p>
        </div>

        {isLoading ? (
          <div>Wedstrijden laden...</div>
        ) : matches && matches.length > 0 ? (
          <div className="space-y-6">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                myPlayer={myPlayer}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                Er zijn momenteel geen aankomende wedstrijden.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default MyMatchesPage;