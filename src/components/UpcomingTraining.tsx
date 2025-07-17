
import { Training } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

interface UpcomingTrainingProps {
  training: Training;
}

const UpcomingTraining = ({ training }: UpcomingTrainingProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Europe/Amsterdam'
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Amsterdam'
    }).format(date);
  };

  const isPast = new Date(training.training_at) < new Date();

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <div>
            <div className="text-2xl">Training</div>
            <div className="text-lg text-muted-foreground font-normal">
              {formatDate(training.training_at)}
            </div>
          </div>
          {isPast && (
            <span className="text-sm bg-muted px-3 py-1 rounded ml-auto">
              Geweest
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Tijd: {formatTime(training.training_at)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingTraining;
