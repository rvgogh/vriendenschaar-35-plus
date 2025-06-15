
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { Match } from "@/types";

interface UpcomingMatchProps {
  match: Match | null;
}

const UpcomingMatch = ({ match }: UpcomingMatchProps) => {
  if (!match) {
    return (
      <Card className="mb-8 bg-secondary border-primary">
        <CardHeader>
          <CardTitle>Loading match...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mb-8 bg-secondary border-primary">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold text-primary">
          Match Details
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
        <div className="flex items-center gap-4">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <p className="font-semibold">Opponent</p>
            <p className="text-muted-foreground">{match.opponent}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingMatch;
