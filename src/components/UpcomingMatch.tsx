
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Shield } from "lucide-react";

const UpcomingMatch = () => {
  return (
    <Card className="mb-8 bg-secondary border-primary">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold text-primary">
          Upcoming Match
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
        <div className="flex items-center gap-4">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <p className="font-semibold">Opponent</p>
            <p className="text-muted-foreground">Local Rivals FC</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <p className="font-semibold">Date</p>
            <p className="text-muted-foreground">Saturday, June 21, 2025</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Clock className="h-8 w-8 text-primary" />
          <div>
            <p className="font-semibold">Time</p>
            <p className="text-muted-foreground">15:00</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <MapPin className="h-8 w-8 text-primary" />
          <div>
            <p className="font-semibold">Location</p>
            <p className="text-muted-foreground">City Stadium</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingMatch;
