
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrainingAttendanceStatus, PlayerWithTrainingStatus } from "@/types";
import PlayerTrainingCard from "./PlayerTrainingCard";
import TrainingStatusIndicator from "./TrainingStatusIndicator";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const noCount = players?.filter(p => p.status === 'NO').length || 0;
  const unknownCount = players?.filter(p => p.status === 'UNKNOWN').length || 0;

  return (
    <div className="space-y-6">
      {/* Status Overview Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Aanwezigheid Overzicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl">🍆</div>
              <div className="text-lg font-semibold text-green-600">{yesCount}</div>
              <div className="text-sm text-muted-foreground">Aanwezig</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl">❌</div>
              <div className="text-lg font-semibold text-red-600">{noCount}</div>
              <div className="text-sm text-muted-foreground">Afwezig</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl">❓</div>
              <div className="text-lg font-semibold text-gray-600">{unknownCount}</div>
              <div className="text-sm text-muted-foreground">Niet gereageerd</div>
            </div>
          </div>
          <div className="mt-4">
            <TrainingStatusIndicator yesCount={yesCount} />
          </div>
        </CardContent>
      </Card>

      {/* Player Cards */}
      <div>
        <h3 className="text-2xl font-bold text-primary mb-4">Spelers</h3>
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
    </div>
  );
};

export default TrainingPlayerList;
