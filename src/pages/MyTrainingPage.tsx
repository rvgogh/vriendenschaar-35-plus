import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrainingAttendanceStatus, PlayerWithTrainingStatus, Training } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { Calendar } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { AttendanceButtons } from "@/components/AttendanceButtons";
import { StatusOverview, StatusCount } from "@/components/StatusOverview";
import { EmptyState } from "@/components/EmptyState";
import { useMyPlayer, useUpcomingTrainings } from "@/hooks/useData";
import { formatDateTime } from "@/lib/datetime";


const fetchPlayersWithTrainingStatus = async (trainingId: number): Promise<PlayerWithTrainingStatus[]> => {
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("*")
    .eq("knvb_member", true)
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
  const isMobile = useIsMobile();
  const [selectedStatus, setSelectedStatus] = useState<TrainingAttendanceStatus>('YES');
  
  const { data: players } = useQuery({
    queryKey: ["trainingPlayers", training.id],
    queryFn: () => fetchPlayersWithTrainingStatus(training.id),
  });

  const myStatus = players?.find(p => p.id === myPlayer?.id)?.status || "UNKNOWN";
  const yesCount = players?.filter(p => p.status === 'YES').length || 0;
  const noCount = players?.filter(p => p.status === 'NO').length || 0;
  const unknownCount = players?.filter(p => p.status === 'UNKNOWN').length || 0;

  // Group players by status
  const playersByStatus = {
    YES: players?.filter(p => p.status === 'YES').sort((a, b) => a.name.localeCompare(b.name)) || [],
    NO: players?.filter(p => p.status === 'NO').sort((a, b) => a.name.localeCompare(b.name)) || [],
    UNKNOWN: players?.filter(p => p.status === 'UNKNOWN').sort((a, b) => a.name.localeCompare(b.name)) || []
  };

  const statusCounts: StatusCount[] = [
    {
      status: 'YES',
      count: yesCount,
      players: playersByStatus.YES,
      emoji: '🍆',
      label: 'Aanwezig',
      color: 'text-green-600'
    },
    {
      status: 'NO',
      count: noCount,
      players: playersByStatus.NO,
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
    }
  ];

  return (
    <Card className="mb-6 bg-secondary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <div>
            <div className="text-xl">Training</div>
            <div className="text-lg text-muted-foreground font-normal">
              {training.training_at ? formatDateTime(training.training_at) : 'Datum onbekend'}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* My Status */}
        {myPlayer && (
          <div>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Mijn status</h4>
            <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
              <span className="font-medium">{myPlayer.name}</span>
              <AttendanceButtons
                variant="training"
                currentStatus={myStatus}
                onStatusChange={(status) => onStatusChange(training.id, status as TrainingAttendanceStatus)}
              />
            </div>
          </div>
        )}

        {/* Status Overview */}
        <div className="border-t pt-4">
          <StatusOverview
            statusCounts={statusCounts}
            selectedStatus={selectedStatus}
            onStatusSelect={(status) => setSelectedStatus(status as TrainingAttendanceStatus)}
          />
        </div>

        {/* All Players List - Desktop Only */}
        {!isMobile && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Alle spelers</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {players?.slice().sort((a, b) => {
                const statusOrder = { 'YES': 0, 'NO': 1, 'UNKNOWN': 2 };
                const statusDiff = statusOrder[a.status] - statusOrder[b.status];
                if (statusDiff !== 0) return statusDiff;
                return a.name.localeCompare(b.name);
              }).map((player) => (
                <div key={player.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                  <span>{player.name}</span>
                  <span className="text-lg">
                    {player.status === 'YES' ? '🍆' : player.status === 'NO' ? '❌' : '➖'}
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

const MyTrainingPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: myPlayer } = useMyPlayer(user?.id);
  const { data: trainings, isLoading } = useUpcomingTrainings();

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
      queryClient.invalidateQueries({ queryKey: ["upcomingTrainings"] });
      toast.success("Status bijgewerkt!");
    },
    onError: (error) => {
      toast.error(`Kon status niet bijwerken: ${error.message}`);
    }
  });

  const handleStatusChange = (trainingId: number, status: TrainingAttendanceStatus) => {
    updateStatusMutation.mutate({ trainingId, status });
  };

  if (!myPlayer) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-[800px]">
        <PageHeader 
          title="Mijn Trainingen" 
          subtitle="Beheer je aanwezigheid voor aankomende trainingen"
        />
        <EmptyState message="Er is geen speler gekoppeld aan jouw account. Neem contact op met de beheerder." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-[800px]">
      <PageHeader 
        title="Mijn Trainingen" 
        subtitle="Beheer je aanwezigheid voor aankomende trainingen"
        showBackButton={false}
      />

      <main>
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
          <EmptyState message="Er zijn momenteel geen aankomende trainingen." />
        )}
      </main>
    </div>
  );
};

export default MyTrainingPage;
