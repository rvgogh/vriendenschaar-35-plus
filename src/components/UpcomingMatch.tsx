
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Calendar, Clock, Users } from "lucide-react";
import { Match } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { countMatchStatuses } from "@/lib/matchHelpers";

interface UpcomingMatchProps {
  match: Match | null;
}

const fetchPlayerStatusCounts = async (matchId: number, opponent: string | null) => {
  const [{ data: statuses, error }, { data: players, error: playersError }] = await Promise.all([
    supabase.from("player_statuses").select("player_id, status").eq("match_id", matchId),
    supabase.from("players").select("id, knvb_member"),
  ]);
  if (error) throw error;
  if (playersError) throw playersError;
  return countMatchStatuses(players || [], statuses || [], opponent);
};

const UpcomingMatch = ({ match }: UpcomingMatchProps) => {
  const { data: statusCounts } = useQuery({
    queryKey: ["playerStatusCounts", match?.id],
    queryFn: () => match ? fetchPlayerStatusCounts(match.id, match.opponent) : null,
    enabled: !!match?.id,
  });

  if (!match) {
    return (
      <Card className="mb-8 bg-secondary border-primary">
        <CardHeader>
          <CardTitle>Wedstrijd laden...</CardTitle>
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

  const { supporterCount = 0, inCount = 0, maybeCount = 0, outCount = 0, unknownCount = 0 } = statusCounts || {};

  return (
    <Card className="mb-8 bg-secondary border-primary">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold text-primary">
          Wedstrijddetails
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
          <div className="flex items-center gap-4">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <p className="font-semibold">Tegenstander</p>
              <p className="text-muted-foreground">{match.opponent}</p>
            </div>
          </div>
          {match.match_date && (
            <div className="flex items-center gap-4">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">Datum</p>
                <p className="text-muted-foreground">{formatDate(match.match_date)}</p>
              </div>
            </div>
          )}
          {match.arrival_time && (
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">Aanwezig zijn</p>
                <p className="text-muted-foreground">{formatTime(match.arrival_time)}</p>
              </div>
            </div>
          )}
          {match.start_time && (
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">Aanvang wedstrijd</p>
                <p className="text-muted-foreground">{formatTime(match.start_time)}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3 text-primary">Status overzicht</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-green-600 font-semibold">
              <span className="mr-2 text-lg">🍆</span>
              <span>{inCount} Aanwezig</span>
            </div>
            <div className="flex items-center text-orange-500 font-semibold">
              <span className="mr-2 text-lg">❓</span>
              <span>{maybeCount} Misschien</span>
            </div>
            <div className="flex items-center text-red-600 font-semibold">
              <span className="mr-2 text-lg">❌</span>
              <span>{outCount} Niet</span>
            </div>
            <div className="flex items-center text-gray-500 font-semibold">
              <span className="mr-2 text-lg">➖</span>
              <span>{unknownCount} Geen reactie</span>
            </div>
            <div className="flex items-center text-primary font-semibold"><span className="mr-2 text-lg">📣</span><span>{supporterCount} Supporters</span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingMatch;
