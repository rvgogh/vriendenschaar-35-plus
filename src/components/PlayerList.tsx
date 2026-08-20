import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PlayerStatus, PlayerWithStatus } from "@/types";
import PlayerCard from "./PlayerCard";
import { toast } from "@/components/ui/sonner";
import { isOpenToAllPlayers } from "@/lib/matchHelpers";

const fetchPlayersWithStatus = async (matchId: number): Promise<PlayerWithStatus[]> => {
    // Determine if this match allows all players (e.g. Gecu cup) or KNVB members only
    const { data: match, error: matchError } = await supabase
        .from("matches")
        .select("opponent")
        .eq("id", matchId)
        .single();
    if (matchError) throw matchError;

    const openToAll = isOpenToAllPlayers(match?.opponent);

    let playersQuery = supabase
        .from("players")
        .select("id, name, knvb_member")
        .order('name', { ascending: true });
    if (!openToAll) {
        playersQuery = playersQuery.eq("knvb_member", true);
    }
    const { data: players, error: playersError } = await playersQuery;
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

const PlayerList = ({ matchId }: { matchId: number }) => {
  const queryClient = useQueryClient();

  const { data: players, isLoading } = useQuery({
      queryKey: ["players", matchId],
      queryFn: () => fetchPlayersWithStatus(matchId),
  });

  const updateStatusMutation = useMutation({
      mutationFn: async ({ playerId, status }: { playerId: number, status: PlayerStatus }) => {
          const { error } = await supabase
              .from("player_statuses")
              .upsert({ match_id: matchId, player_id: playerId, status: status });
          if (error) throw error;
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["players", matchId] });
          queryClient.invalidateQueries({ queryKey: ["matches"] });
          queryClient.invalidateQueries({ queryKey: ["playerStatusCounts", matchId] });
          // Invalidate homepage presence queries
          queryClient.invalidateQueries({ queryKey: ["matchPresence"] });
          toast.success("Status bijgewerkt!");
      },
      onError: (error) => {
          toast.error(`Kon status niet bijwerken: ${error.message}`);
      }
  });

  const handleStatusChange = (id: number, status: PlayerStatus) => {
      updateStatusMutation.mutate({ playerId: id, status });
  };

  if (isLoading) return <div>Spelers laden...</div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-primary">Selectie</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players?.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>
    </div>
  );
};

export default PlayerList;
