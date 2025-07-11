
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, FileText, UtensilsCrossed } from "lucide-react";
import { Event } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UpcomingEventProps {
  event: Event | null;
}

const fetchEventStatusCounts = async (eventId: number) => {
  const { data: statuses, error: statusesError } = await supabase
    .from("event_statuses")
    .select("status")
    .eq("event_id", eventId);

  if (statusesError) {
    console.error("Error fetching event statuses:", statusesError);
    return { yesCount: 0, maybeCount: 0, noCount: 0, unknownCount: 0 };
  }

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id");

  if (playersError) {
    console.error("Error fetching players:", playersError);
    return { yesCount: 0, maybeCount: 0, noCount: 0, unknownCount: 0 };
  }

  const totalPlayers = players?.length || 0;
  const yesCount = (statuses || []).filter(s => s.status === 'YES').length;
  const maybeCount = (statuses || []).filter(s => s.status === 'MAYBE').length;
  const noCount = (statuses || []).filter(s => s.status === 'NO').length;
  const respondedCount = yesCount + maybeCount + noCount;
  const unknownCount = totalPlayers - respondedCount;

  return { yesCount, maybeCount, noCount, unknownCount };
};

const UpcomingEvent = ({ event }: UpcomingEventProps) => {
  const { data: statusCounts } = useQuery({
    queryKey: ["eventStatusCounts", event?.id],
    queryFn: () => fetchEventStatusCounts(event!.id),
    enabled: !!event?.id,
  });

  if (!event) {
    return (
      <Card className="mb-8 bg-secondary border-primary">
        <CardHeader>
          <CardTitle>Evenement laden...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Europe/Amsterdam'
    }).format(date);
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // Format HH:MM from HH:MM:SS
  };

  const { yesCount = 0, maybeCount = 0, noCount = 0, unknownCount = 0 } = statusCounts || {};
  const berrySchotels = Math.ceil(yesCount / 4);

  return (
    <Card className="mb-8 bg-secondary border-primary">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold text-primary">
          Evenementdetails
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold">{event.title}</h2>
          {event.subtitle && (
            <p className="text-lg text-muted-foreground italic mt-1">{event.subtitle}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
          {event.event_date && (
            <div className="flex items-center gap-4">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">Datum</p>
                <p className="text-muted-foreground">{formatDate(event.event_date)}</p>
              </div>
            </div>
          )}
          {event.event_time && (
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">Tijd</p>
                <p className="text-muted-foreground">{formatTime(event.event_time)}</p>
              </div>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-4 md:col-span-2">
              <MapPin className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">Locatie</p>
                <p className="text-muted-foreground">{event.location}</p>
              </div>
            </div>
          )}
        </div>

        {event.description && (
          <div className="border-t pt-4">
            <div className="flex items-start gap-4">
              <FileText className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold mb-2 text-primary">Beschrijving</h3>
                <p className="text-muted-foreground whitespace-pre-line">{event.description}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3 text-primary">Deelname overzicht</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-green-600 font-semibold">
              <span className="mr-2 text-lg">🍆</span>
              <span>{yesCount} Ja</span>
            </div>
            <div className="flex items-center text-orange-500 font-semibold">
              <span className="mr-2 text-lg">❓</span>
              <span>{maybeCount} Misschien</span>
            </div>
            <div className="flex items-center text-red-600 font-semibold">
              <span className="mr-2 text-lg">❌</span>
              <span>{noCount} Niet</span>
            </div>
            <div className="flex items-center text-gray-500 font-semibold">
              <span className="mr-2 text-lg">➖</span>
              <span>{unknownCount} Geen reactie</span>
            </div>
          </div>
        </div>

        {yesCount > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-4">
              <UtensilsCrossed className="h-6 w-6 text-primary" />
              <div>
                <h3 className="text-lg font-semibold text-primary">Berry schotels benodigd</h3>
                <p className="text-muted-foreground">
                  {berrySchotels} Berry schotel{berrySchotels !== 1 ? 's' : ''} 
                  <span className="text-sm ml-2">(bittergarnituur met friet en saus)</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Berekening: {yesCount} aanmeldingen ÷ 4 = {berrySchotels} schotel{berrySchotels !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingEvent;
