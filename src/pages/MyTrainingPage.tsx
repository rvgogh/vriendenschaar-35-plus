import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrainingAttendanceStatus, PlayerWithTrainingStatus, Training } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { Calendar, MapPin } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { AttendanceButtons } from "@/components/AttendanceButtons";
import { StatusOverview, StatusCount } from "@/components/StatusOverview";
import { EmptyState } from "@/components/EmptyState";
import { useMyPlayer, useUpcomingTrainings } from "@/hooks/useData";
import { formatDateTime } from "@/lib/datetime";
import { useGpsVerificationForMultipleTrainings } from "@/hooks/useGpsVerification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type PlayerWithTrainingStatusExtended = PlayerWithTrainingStatus & {
  verified_at?: string | null;
};

const fetchPlayersWithTrainingStatus = async (trainingId: number): Promise<PlayerWithTrainingStatusExtended[]> => {
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

  const statusMap = new Map((statuses || []).map(s => [s.player_id, { status: s.status, verified_at: s.verified_at }]));

  return (players || []).map(p => ({
    ...p,
    status: statusMap.get(p.id)?.status || "UNKNOWN",
    verified_at: statusMap.get(p.id)?.verified_at || null,
  }));
};

const usePastTrainings = () => {
  return useQuery({
    queryKey: ["pastTrainings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainings")
        .select("*")
        .lt("training_at", new Date().toISOString())
        .order("training_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Training[];
    },
  });
};

const GpsVerifiedIcon = ({ verifiedAt }: { verifiedAt: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <MapPin className="h-4 w-4 text-green-600" />
      </TooltipTrigger>
      <TooltipContent>
        <p>GPS geverifieerd op {new Date(verifiedAt).toLocaleString('nl-NL')}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const TrainingCard = ({ training, myPlayer, onStatusChange, isPast = false }: {
  training: Training;
  myPlayer: any;
  onStatusChange: (trainingId: number, status: TrainingAttendanceStatus) => void;
  isPast?: boolean;
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
      players: playersByStatus.YES.map(p => ({
        ...p,
        verified_at: p.verified_at
      })),
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
              {isPast ? (
                <span className="text-lg">
                  {myStatus === 'YES' ? '🍆' : myStatus === 'NO' ? '❌' : '➖'}
                </span>
              ) : (
                <AttendanceButtons
                  variant="training"
                  currentStatus={myStatus}
                  onStatusChange={(status) => onStatusChange(training.id, status as TrainingAttendanceStatus)}
                />
              )}
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
                  <div className="flex items-center gap-2">
                    <span>{player.name}</span>
                    {player.verified_at && <GpsVerifiedIcon verifiedAt={player.verified_at} />}
                  </div>
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
  const { data: pastTrainings, isLoading: isPastLoading } = usePastTrainings();

  // Auto-verify GPS when player visits the page and is at training location
  const trainingIds = trainings?.map(t => t.id) || [];
  useGpsVerificationForMultipleTrainings(trainingIds, myPlayer?.id || null, !!myPlayer);


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
        subtitle="Beheer je aanwezigheid voor trainingen"
        showBackButton={false}
      />

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="upcoming">Aankomend</TabsTrigger>
          <TabsTrigger value="past">Afgelopen</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
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
        </TabsContent>
        
        <TabsContent value="past">
          {isPastLoading ? (
            <div>Trainingen laden...</div>
          ) : pastTrainings && pastTrainings.length > 0 ? (
            <div className="space-y-6">
              {pastTrainings.map((training) => (
                <TrainingCard
                  key={training.id}
                  training={training}
                  myPlayer={myPlayer}
                  onStatusChange={handleStatusChange}
                  isPast={true}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="Er zijn geen afgelopen trainingen." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyTrainingPage;
