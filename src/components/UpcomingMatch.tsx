
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Calendar, Clock, Users } from "lucide-react";
import { Match } from "@/types";

interface UpcomingMatchProps {
  match: Match | null;
}

const UpcomingMatch = ({ match }: UpcomingMatchProps) => {
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

  return (
    <Card className="mb-8 bg-secondary border-primary">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold text-primary">
          Wedstrijddetails
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
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
      </CardContent>
    </Card>
  );
};

export default UpcomingMatch;
