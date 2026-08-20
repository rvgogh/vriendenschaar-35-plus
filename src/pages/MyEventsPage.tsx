import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EventAttendanceStatus, PlayerWithEventStatus, Event } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Calendar, MapPin, UtensilsCrossed } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader } from "@/components/PageHeader";
import { AttendanceButtons } from "@/components/AttendanceButtons";
import { StatusOverview, StatusCount } from "@/components/StatusOverview";
import { EmptyState } from "@/components/EmptyState";
import { useMyPlayer, useUpcomingEvents } from "@/hooks/useData";
import { formatDateLong, formatTime } from "@/lib/datetime";


const fetchPlayersWithEventStatus = async (eventId: number): Promise<PlayerWithEventStatus[]> => {
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id, name, knvb_member")
    .order('name', { ascending: true });
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

const EventCard = ({ event, myPlayer, onStatusChange }: {
  event: Event;
  myPlayer: any;
  onStatusChange: (eventId: number, status: EventAttendanceStatus) => void;
}) => {
  const isMobile = useIsMobile();
  const { data: players } = useQuery({
    queryKey: ["eventPlayers", event.id],
    queryFn: () => fetchPlayersWithEventStatus(event.id),
  });

  const myStatus = players?.find(p => p.id === myPlayer?.id)?.status || "UNKNOWN";
  const yesCount = players?.filter(p => p.status === 'YES').length || 0;
  const noCount = players?.filter(p => p.status === 'NO').length || 0;
  const maybeCount = players?.filter(p => p.status === 'MAYBE').length || 0;
  const unknownCount = players?.filter(p => p.status === 'UNKNOWN').length || 0;

  const berrySchotels = Math.ceil(yesCount / 4);

  // Group players by status for mobile support
  const playersByStatus = {
    YES: players?.filter(p => p.status === 'YES').sort((a, b) => a.name.localeCompare(b.name)) || [],
    MAYBE: players?.filter(p => p.status === 'MAYBE').sort((a, b) => a.name.localeCompare(b.name)) || [],
    NO: players?.filter(p => p.status === 'NO').sort((a, b) => a.name.localeCompare(b.name)) || [],
    UNKNOWN: players?.filter(p => p.status === 'UNKNOWN').sort((a, b) => a.name.localeCompare(b.name)) || []
  };

  const statusCounts: StatusCount[] = [
    {
      status: 'YES',
      count: yesCount,
      players: playersByStatus.YES,
      emoji: '🍆',
      label: 'Ja',
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
      status: 'NO',
      count: noCount,
      players: playersByStatus.NO,
      emoji: '❌',
      label: 'Nee',
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
            <div className="text-xl">{event.title}</div>
            {event.subtitle && (
              <div className="text-sm text-muted-foreground italic mb-1">{event.subtitle}</div>
            )}
            <div className="text-lg text-muted-foreground font-normal">
              {event.event_date ? formatDateLong(event.event_date) : 'Datum onbekend'}
              {event.event_time && ` om ${formatTime(event.event_time)}`}
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
        </CardTitle>
        {event.description && (
          <p className="text-sm text-muted-foreground">{event.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* My Status */}
        {myPlayer && (
          <div>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Mijn aanwezigheid</h4>
            <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
              <span className="font-medium">{myPlayer.name}</span>
              <AttendanceButtons
                variant="event"
                currentStatus={myStatus}
                onStatusChange={(status) => onStatusChange(event.id, status as EventAttendanceStatus)}
              />
            </div>
          </div>
        )}

        {/* Status Overview */}
        <div className="border-t pt-4">
          <StatusOverview statusCounts={statusCounts} />

          {yesCount > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-primary font-semibold pt-4 border-t mt-4">
              <UtensilsCrossed className="h-4 w-4" />
              <span>{berrySchotels} Berry schotel{berrySchotels !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* All Players List */}
        {!isMobile && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Alle spelers</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {players?.slice().sort((a, b) => {
                const statusOrder = { 'YES': 0, 'MAYBE': 1, 'NO': 2, 'UNKNOWN': 3 };
                const statusDiff = statusOrder[a.status] - statusOrder[b.status];
                if (statusDiff !== 0) return statusDiff;
                return a.name.localeCompare(b.name);
              }).map((player) => (
                <div key={player.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                  <span>{player.name}</span>
                  <span className="text-lg">
                    {player.status === 'YES' ? '🍆' : player.status === 'MAYBE' ? '❓' : player.status === 'NO' ? '❌' : '➖'}
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

const MyEventsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: myPlayer } = useMyPlayer(user?.id);
  const { data: events, isLoading } = useUpcomingEvents();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: number, status: EventAttendanceStatus }) => {
      if (!myPlayer) throw new Error("Geen speler gekoppeld aan account");
      
      const { error } = await supabase
        .from("event_statuses")
        .upsert({ event_id: eventId, player_id: myPlayer.id, status: status });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventPlayers"] });
      queryClient.invalidateQueries({ queryKey: ["upcomingEvents"] });
      queryClient.invalidateQueries({ queryKey: ["eventPresence"] });
      toast.success("Aanwezigheid bijgewerkt!");
    },
    onError: (error) => {
      toast.error(`Kon aanwezigheid niet bijwerken: ${error.message}`);
    }
  });

  const handleStatusChange = (eventId: number, status: EventAttendanceStatus) => {
    updateStatusMutation.mutate({ eventId, status });
  };

  if (!myPlayer) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-[800px]">
        <PageHeader 
          title="Mijn Evenementen" 
          subtitle="Beheer je aanwezigheid voor aankomende evenementen"
        />
        <EmptyState message="Er is geen speler gekoppeld aan jouw account. Neem contact op met de beheerder." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-[800px]">
      <PageHeader 
        title="Mijn Evenementen" 
        subtitle="Beheer je aanwezigheid voor aankomende evenementen"
      />

      <main>
        {isLoading ? (
          <div>Evenementen laden...</div>
        ) : events && events.length > 0 ? (
          <div className="space-y-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                myPlayer={myPlayer}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="Er zijn momenteel geen aankomende evenementen." />
        )}
      </main>
    </div>
  );
};

export default MyEventsPage;