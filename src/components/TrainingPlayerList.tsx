import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrainingAttendanceStatus, PlayerWithTrainingStatus } from "@/types";
import PlayerTrainingCard from "./PlayerTrainingCard";
import { toast } from "@/components/ui/sonner";

const fetchPlayersWithTrainingStatus = async (trainingId: number): Promise<PlayerWithTrainingStatus[]> => {
    const { data: players, error: playersError } = await supabase.from("players").select("*").order('name', { ascending: true });
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

const TrainingPlayerList = ({ trainingId }: { trainingId: number }) => {
  const queryClient = useQueryClient();

  const { data: players, isLoading } = useQuery({
      queryKey: ["trainingPlayers", trainingId],
      queryFn: () => fetchPlayersWithTrainingStatus(trainingId),
  });

  const updateStatusMutation = useMutation({
      mutationFn: async ({ playerId, status }: { playerId: number, status: TrainingAttendanceStatus }) => {
          const { error } = await supabase
              .from("training_statuses")
              .upsert({ training_id: trainingId, player_id: playerId, status: status });
          if (error) throw error;
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["trainingPlayers", trainingId] });
          queryClient.invalidateQueries({ queryKey: ["trainings"] });
          toast.success("Status bijgewerkt!");
      },
      onError: (error) => {
          toast.error(`Kon status niet bijwerken: ${error.message}`);
      }
  });

  const handleStatusChange = (id: number, status: TrainingAttendanceStatus) => {
      updateStatusMutation.mutate({ playerId: id, status });
  };

  if (isLoading) return <div>Spelers laden...</div>;

  const yesCount = players?.filter(p => p.status === 'YES').length || 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-primary">Aanwezigheid</h3>
        <div className="text-right">
            <p className="text-xl font-bold text-primary">{yesCount} 🍆</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players?.map((player) => (
          <PlayerTrainingCard
            key={player.id}
            player={player}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>
    </div>
  );
};

export default TrainingPlayerList;
