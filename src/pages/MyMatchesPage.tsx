import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PlayerStatus, PlayerWithStatus, Match } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Calendar, UserCheck } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { generateICalForMatches, downloadICalFile } from "@/utils/icalExport";
import { PageHeader } from "@/components/PageHeader";
import { AttendanceButtons } from "@/components/AttendanceButtons";
import { StatusOverview, StatusCount } from "@/components/StatusOverview";
import { EmptyState } from "@/components/EmptyState";
import { useMyPlayer, useUpcomingMatches } from "@/hooks/useData";
import { formatDateLong, formatTime } from "@/lib/datetime";
import { canPlayMatch } from "@/lib/matchHelpers";


const fetchPlayersWithMatchStatus = async (matchId: number, opponent: string | null): Promise<PlayerWithStatus[]> => {
  let playersQuery = supabase
    .from("players")
    .select("id, name, knvb_member")
    .order('name', { ascending: true });
  const { data: players, error: playersError } = await playersQuery;
  if (playersError) throw playersError;

  const { data: statuses, error: statusesError } = await supabase
    .from("player_statuses")
    .select("*")
    .eq("match_id", matchId);
  if (statusesError) throw statusesError;

  const statusMap = new Map((statuses || []).map(s => [s.player_id, s.status]));

  return (players || []).filter(p => canPlayMatch(p, opponent) || statusMap.get(p.id) === "SUPPORTER").map(p => ({
    ...p,
    status: statusMap.get(p.id) || "UNKNOWN",
  }));
};

const MatchCard = ({ match, myPlayer, onStatusChange }: {
  match: Match;
  myPlayer: any;
  onStatusChange: (matchId: number, status: PlayerStatus) => void;
}) => {
  const isMobile = useIsMobile();
  const [selectedStatus, setSelectedStatus] = useState<PlayerStatus>('IN');
  
  const { data: players } = useQuery({
    queryKey: ["matchPlayers", match.id],
    queryFn: () => fetchPlayersWithMatchStatus(match.id, match.opponent),
  });

  const { data: ownStatus } = useQuery({
    queryKey: ["matchPlayers", match.id, "own", myPlayer?.id],
    enabled: !!myPlayer,
    queryFn: async () => {
      const { data, error } = await supabase.from("player_statuses").select("status")
        .eq("match_id", match.id).eq("player_id", myPlayer.id).maybeSingle();
      if (error) throw error;
      return data?.status || "UNKNOWN";
    },
  });
  const myStatus = ownStatus || "UNKNOWN";
  const inCount = players?.filter(p => p.status === 'IN').length || 0;
  const outCount = players?.filter(p => p.status === 'OUT').length || 0;
  const maybeCount = players?.filter(p => p.status === 'MAYBE').length || 0;
  const supporterCount = players?.filter(p => p.status === 'SUPPORTER').length || 0;
  const unknownCount = players?.filter(p => p.status === 'UNKNOWN').length || 0;

  // Group players by status
  const playersByStatus = {
    SUPPORTER: players?.filter(p => p.status === 'SUPPORTER').sort((a, b) => a.name.localeCompare(b.name)) || [],
    IN: players?.filter(p => p.status === 'IN').sort((a, b) => a.name.localeCompare(b.name)) || [],
    MAYBE: players?.filter(p => p.status === 'MAYBE').sort((a, b) => a.name.localeCompare(b.name)) || [],
    OUT: players?.filter(p => p.status === 'OUT').sort((a, b) => a.name.localeCompare(b.name)) || [],
    UNKNOWN: players?.filter(p => p.status === 'UNKNOWN').sort((a, b) => a.name.localeCompare(b.name)) || []
  };

  const statusCounts: StatusCount[] = [
    {
      status: 'IN',
      count: inCount,
      players: playersByStatus.IN,
      emoji: '🍆',
      label: 'Aanwezig',
      color: 'text-green-600'
    },
    {
      status: 'MAYBE',
      count: maybeCount,
      players: playersByStatus.MAYBE,
      emoji: '❓',
      label: 'Misschien',
      color: 'text-orange-500'
    },
    {
      status: 'OUT',
      count: outCount,
      players: playersByStatus.OUT,
      emoji: '❌',
      label: 'Afwezig',
      color: 'text-red-600'
    },
    {
      status: 'UNKNOWN',
      count: unknownCount,
      players: playersByStatus.UNKNOWN,
      emoji: '➖',
      label: 'Niet gereageerd',
      color: 'text-gray-600'
    },
    { status: "SUPPORTER", count: supporterCount, players: playersByStatus.SUPPORTER, emoji: "📣", label: "Supporters", color: "text-primary" },
  ];

  return (
    <Card className="mb-6 bg-secondary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <div>
            <div className="text-xl">{match.opponent}</div>
            <div className="text-lg text-muted-foreground font-normal">
              {match.match_date ? formatDateLong(match.match_date) : 'Datum onbekend'}
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
            <div className="flex flex-wrap gap-2 items-center justify-between p-3 bg-card rounded-lg border">
              <span className="font-medium">{myPlayer.name}</span>
              <AttendanceButtons
                variant="match"
                canPlay={canPlayMatch(myPlayer, match.opponent)}
                currentStatus={myStatus}
                onStatusChange={(status) => onStatusChange(match.id, status as PlayerStatus)}
              />
            </div>
          </div>
        )}

        {/* Status Overview */}
        <div className="border-t pt-4">
          <StatusOverview
            statusCounts={statusCounts}
            selectedStatus={selectedStatus}
            onStatusSelect={(status) => setSelectedStatus(status as PlayerStatus)}
          />
        </div>

        {/* All Players List - Desktop Only */}
        {!isMobile && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Alle spelers</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {players?.slice().sort((a, b) => {
                const statusOrder = { 'IN': 0, 'SUPPORTER': 1, 'MAYBE': 2, 'OUT': 3, 'UNKNOWN': 4 };
                const statusDiff = statusOrder[a.status] - statusOrder[b.status];
                if (statusDiff !== 0) return statusDiff;
                return a.name.localeCompare(b.name);
              }).map((player) => (
                <div key={player.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                  <span>{player.name}</span>
                  <span className="text-lg">
                    {player.status === 'SUPPORTER' ? '📣' : player.status === 'IN' ? '🍆' : player.status === 'MAYBE' ? '❓' : player.status === 'OUT' ? '❌' : '➖'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const MyMatchesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: myPlayer } = useMyPlayer(user?.id);
  const { data: matches, isLoading } = useUpcomingMatches();

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
      queryClient.invalidateQueries({ queryKey: ["upcomingMatches"] });
      queryClient.invalidateQueries({ queryKey: ["matchPresence"] });
      toast.success("Status bijgewerkt!");
    },
    onError: (error) => {
      toast.error(`Kon status niet bijwerken: ${error.message}`);
    }
  });

  const handleStatusChange = (matchId: number, status: PlayerStatus) => {
    updateStatusMutation.mutate({ matchId, status });
  };

  const handleICalExport = () => {
    if (!matches || matches.length === 0) {
      toast.error("Er zijn nog geen wedstrijden om te exporteren.");
      return;
    }

    const iCalContent = generateICalForMatches(matches);
    downloadICalFile(iCalContent, 'mijn-wedstrijden.ics');
    
    toast.success("De wedstrijden zijn geëxporteerd naar je agenda.");
  };

  if (!myPlayer) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-[800px]">
        <PageHeader 
          title="Mijn Wedstrijden" 
          subtitle="Beheer je aanwezigheid voor aankomende wedstrijden"
        />
        <EmptyState message="Er is geen speler gekoppeld aan jouw account. Neem contact op met de beheerder." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-[800px]">
      <div>
        <PageHeader 
          title="Mijn Wedstrijden" 
          subtitle="Beheer je aanwezigheid voor aankomende wedstrijden"
          showBackButton={false}
        />
        {matches && matches.length > 0 && (
          <div className="mb-6">
            <Button onClick={handleICalExport} variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Exporteer naar agenda
            </Button>
          </div>
        )}
      </div>

      <main>
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
          <EmptyState message="Er zijn momenteel geen aankomende wedstrijden." />
        )}
      </main>
    </div>
  );
};

export default MyMatchesPage;