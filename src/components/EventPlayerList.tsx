
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EventAttendanceStatus, PlayerWithEventStatus } from "@/types";
import EventPlayerCard from "./EventPlayerCard";
import { toast } from "@/components/ui/sonner";

const fetchPlayersWithEventStatus = async (eventId: number): Promise<PlayerWithEventStatus[]> => {
    const { data: players, error: playersError } = await supabase.from("players").select("*").order('name', { ascending: true });
    if (playersError) throw playersError;

    const { data: statuses, error: statusesError } = await supabase
        .from("event_statuses")
        .select("*")
        .eq("event_id", eventId);
    if (statusesError) throw statusesError;

    const statusMap = new Map((statuses || []).map(s => [s.player_id, s.status]));

    return (players || []).map(p => ({
        ...p,
        status: statusMap.get(p.id) || "UNKNOWN",
    }));
};

const EventPlayerList = ({ eventId }: { eventId: number }) => {
  const queryClient = useQueryClient();

  const { data: players, isLoading } = useQuery({
      queryKey: ["eventPlayers", eventId],
      queryFn: () => fetchPlayersWithEventStatus(eventId),
  });

  const updateStatusMutation = useMutation({
      mutationFn: async ({ playerId, status }: { playerId: number, status: EventAttendanceStatus }) => {
          const { error } = await supabase
              .from("event_statuses")
              .upsert({ event_id: eventId, player_id: playerId, status: status });
          if (error) throw error;
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["eventPlayers", eventId] });
          queryClient.invalidateQueries({ queryKey: ["events"] });
          queryClient.invalidateQueries({ queryKey: ["eventStatusCounts", eventId] });
          toast.success("Status bijgewerkt!");
      },
      onError: (error) => {
          toast.error(`Kon status niet bijwerken: ${error.message}`);
      }
  });

  const handleStatusChange = (id: number, status: EventAttendanceStatus) => {
      updateStatusMutation.mutate({ playerId: id, status });
  };

  if (isLoading) return <div>Spelers laden...</div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-primary">Deelname</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players?.map((player) => (
          <EventPlayerCard
            key={player.id}
            player={player}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>
    </div>
  );
};

export default EventPlayerList;
