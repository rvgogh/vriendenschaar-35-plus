import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PlayerStatus, PlayerWithStatus } from "@/types";
import PlayerCard from "./PlayerCard";
import { toast } from "@/components/ui/sonner";

const fetchPlayersWithStatus = async (matchId: number): Promise<PlayerWithStatus[]> => {
    const { data: players, error: playersError } = await supabase.from("players").select("*").order('name', { ascending: true });
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

  const inCount = players?.filter(p => p.status === 'IN').length || 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold text-primary">Selectie</h2>
        <div className="text-right">
            <p className="text-2xl font-bold text-primary">{inCount} 🍆</p>
        </div>
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
