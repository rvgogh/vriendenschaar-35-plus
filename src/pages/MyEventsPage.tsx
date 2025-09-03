import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EventAttendanceStatus, PlayerWithEventStatus, Event } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, MapPin, UtensilsCrossed } from "lucide-react";
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

const fetchUpcomingEvents = async () => {
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .gte("event_date", new Date().toISOString().split('T')[0])
    .order("event_date", { ascending: true });
  
  if (error) throw error;
  return events;
};

const fetchPlayersWithEventStatus = async (eventId: number): Promise<PlayerWithEventStatus[]> => {
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("*")
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
  const { data: players } = useQuery({
    queryKey: ["eventPlayers", event.id],
    queryFn: () => fetchPlayersWithEventStatus(event.id),
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
  const yesCount = players?.filter(p => p.status === 'YES').length || 0;
  const noCount = players?.filter(p => p.status === 'NO').length || 0;
  const maybeCount = players?.filter(p => p.status === 'MAYBE').length || 0;
  const unknownCount = players?.filter(p => p.status === 'UNKNOWN').length || 0;

  const berrySchotels = Math.ceil(yesCount / 4);

  // Sort players by status and then alphabetically
  const sortedPlayers = players?.slice().sort((a, b) => {
    const statusOrder = { 'YES': 0, 'MAYBE': 1, 'NO': 2, 'UNKNOWN': 3 };
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
            <div className="text-xl">{event.title}</div>
            {event.subtitle && (
              <div className="text-sm text-muted-foreground italic mb-1">{event.subtitle}</div>
            )}
            <div className="text-lg text-muted-foreground font-normal">
              {event.event_date ? formatDate(event.event_date) : 'Datum onbekend'}
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
              <div className="flex gap-2">
                <Button 
                  variant='outline'
                  size="sm" 
                  onClick={() => onStatusChange(event.id, myStatus === 'YES' ? 'UNKNOWN' : 'YES')}
                  className={cn("text-2xl w-12", myStatus === 'YES' && "ring-2 ring-primary")}
                >
                  🍆
                </Button>
                <Button 
                  variant='outline'
                  size="sm" 
                  onClick={() => onStatusChange(event.id, myStatus === 'MAYBE' ? 'UNKNOWN' : 'MAYBE')}
                  className={cn("text-2xl w-12", myStatus === 'MAYBE' && "ring-2 ring-orange-500")}
                >
                  ❓
                </Button>
                <Button 
                  variant='outline'
                  size="sm" 
                  onClick={() => onStatusChange(event.id, myStatus === 'NO' ? 'UNKNOWN' : 'NO')}
                  className={cn("text-2xl w-12", myStatus === 'NO' && "ring-2 ring-destructive")}
                >
                  ❌
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Status Overview */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Aanwezigheidsoverzicht</h4>
          <div className="grid grid-cols-4 gap-4 text-center text-sm">
            <div className="space-y-1">
              <div className="text-xl">🍆</div>
              <div className="font-semibold text-green-600">{yesCount}</div>
              <div className="text-muted-foreground">Ja</div>
            </div>
            <div className="space-y-1">
              <div className="text-xl">❓</div>
              <div className="font-semibold text-orange-500">{maybeCount}</div>
              <div className="text-muted-foreground">Misschien</div>
            </div>
            <div className="space-y-1">
              <div className="text-xl">❌</div>
              <div className="font-semibold text-red-600">{noCount}</div>
              <div className="text-muted-foreground">Nee</div>
            </div>
            <div className="space-y-1">
              <div className="text-xl">➖</div>
              <div className="font-semibold text-gray-600">{unknownCount}</div>
              <div className="text-muted-foreground">Niet gereageerd</div>
            </div>
          </div>

          {yesCount > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-primary font-semibold pt-4 border-t mt-4">
              <UtensilsCrossed className="h-4 w-4" />
              <span>{berrySchotels} Berry schotel{berrySchotels !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* All Players List */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Alle spelers</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {sortedPlayers.map((player) => (
              <div key={player.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                <span>{player.name}</span>
                <span className="text-lg">
                  {player.status === 'YES' ? '🍆' : player.status === 'MAYBE' ? '❓' : player.status === 'NO' ? '❌' : '➖'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MyEventsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: myPlayer } = useQuery({
    queryKey: ["myPlayer", user?.id],
    queryFn: () => fetchMyPlayer(user!.id),
    enabled: !!user?.id,
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ["upcomingEvents"],
    queryFn: fetchUpcomingEvents,
  });

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
      queryClient.invalidateQueries({ queryKey: ["events"] });
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
          <h1 className="text-3xl font-bold text-primary mb-2">Mijn Evenementen</h1>
          <p className="text-muted-foreground">
            Beheer je aanwezigheid voor aankomende evenementen
          </p>
        </div>

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
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                Er zijn momenteel geen aankomende evenementen.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default MyEventsPage;