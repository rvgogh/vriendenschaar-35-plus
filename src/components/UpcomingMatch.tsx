
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Calendar } from "lucide-react";
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
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Amsterdam'
    }).format(date);
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
              <p className="font-semibold">Datum & Tijd</p>
              <p className="text-muted-foreground">{formatDate(match.match_date)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingMatch;
